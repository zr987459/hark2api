// 在 App 进程内启动 Node.js（nodejs-mobile），运行 Hark2API 网关 server.mjs
#include <jni.h>
#include <string>
#include <vector>
#include <cstdlib>
#include <cstring>
#include <unistd.h>
#include <pthread.h>
#include <android/log.h>
#include <cstdio>
#include "node.h"

static int pipeOut[2];
static int pipeErr[2];

static void *pump(void *arg) {
    int fd = *(int *) arg;
    int prio = (fd == pipeErr[0]) ? ANDROID_LOG_ERROR : ANDROID_LOG_INFO;
    char buf[2048];
    ssize_t n;
    while ((n = read(fd, buf, sizeof(buf) - 1)) > 0) {
        if (buf[n - 1] == '\n') --n;
        buf[n] = 0;
        __android_log_write(prio, "HarkNode", buf);
    }
    return nullptr;
}

static void redirectStdio() {
    setvbuf(stdout, nullptr, _IOLBF, 0);
    setvbuf(stderr, nullptr, _IONBF, 0);
    pipe(pipeOut);
    pipe(pipeErr);
    dup2(pipeOut[1], STDOUT_FILENO);
    dup2(pipeErr[1], STDERR_FILENO);
    pthread_t t1, t2;
    pthread_create(&t1, nullptr, pump, &pipeOut[0]);
    pthread_create(&t2, nullptr, pump, &pipeErr[0]);
    pthread_detach(t1);
    pthread_detach(t2);
}

extern "C" JNIEXPORT jint JNICALL
Java_com_hark2api_gateway_NodeService_startNode(
    JNIEnv *env,
    jobject /* this */,
    jobjectArray args,
    jobjectArray envs,
    jstring rootDir
) {
    redirectStdio();

    const char *rStr = env->GetStringUTFChars(rootDir, nullptr);
    if (rStr && rStr[0]) {
        chdir(rStr);
    }
    env->ReleaseStringUTFChars(rootDir, rStr);

    // 设置环境变量
    if (envs != nullptr) {
        jsize eCount = env->GetArrayLength(envs);
        for (jsize i = 0; i < eCount; ++i) {
            auto jEnv = (jstring) env->GetObjectArrayElement(envs, i);
            const char *envStr = env->GetStringUTFChars(jEnv, nullptr);
            if (envStr) {
                putenv(strdup(envStr));
                env->ReleaseStringUTFChars(jEnv, envStr);
            }
            env->DeleteLocalRef(jEnv);
        }
    }

    // 参数转换
    int n = 0;
    std::vector<std::string> argStrs;
    if (args != nullptr) {
        jsize count = env->GetArrayLength(args);
        n = (int) count;
        argStrs.reserve(n);
        for (jsize i = 0; i < count; ++i) {
            auto jStr = (jstring) env->GetObjectArrayElement(args, i);
            const char *cStr = env->GetStringUTFChars(jStr, nullptr);
            argStrs.emplace_back(cStr ? cStr : "");
            env->ReleaseStringUTFChars(jStr, cStr);
            env->DeleteLocalRef(jStr);
        }
    }

    std::vector<char *> argv(n + 1, nullptr);
    for (int i = 0; i < n; ++i) {
        argv[i] = const_cast<char *>(argStrs[i].c_str());
    }

    __android_log_print(ANDROID_LOG_INFO, "HarkNode", "Starting Hark2API Node.js with %d args", n);
    return node::Start(n, argv.data());
}
