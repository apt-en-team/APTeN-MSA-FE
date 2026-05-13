pipeline {
    agent {
        kubernetes {
            // Jenkins가 빌드를 위해 띄울 임시 Pod 설정
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:22.12.0-alpine
    command: ["cat"]
    tty: true
    resources:
      requests:
        memory: "1Gi"
        cpu: "500m"
      limits:
        memory: "2Gi"
        cpu: "1000m"
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command: ["sleep"]
    args: ["9999999"]
    volumeMounts:
      - name: harbor-token
        mountPath: /kaniko/.docker
  volumes:
    - name: harbor-token
      secret:
        secretName: "harbor-secret"
        items:
          - key: .dockerconfigjson
            path: config.json
"""
        }
    }

    environment {
        // Harbor 정보 (강사님 환경에 맞춰 수정)
        REGISTRY = "harbor.greenart.n-e.kr"
        PROJECT = "apten"
        IMAGE_NAME = "vue-fe"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Node Install & Build') {
            steps {
                container('node') {
                    // 환경 변수 주입이 필요하다면 여기서 처리
                    sh "npm install"
                    sh "npm run build"
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                container('kaniko') {
                    // Kaniko를 이용해 Dockerfile 빌드 및 Harbor 푸시
                    sh """
                    /kaniko/executor --context ${WORKSPACE} \
                        --dockerfile ${WORKSPACE}/Dockerfile \
                        --destination ${REGISTRY}/${PROJECT}/${IMAGE_NAME}:${env.BUILD_NUMBER} \
                        --destination ${REGISTRY}/${PROJECT}/${IMAGE_NAME}:latest \
                        --skip-tls-verify
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Successfully pushed to Harbor: ${IMAGE_NAME}:${env.BUILD_NUMBER}"
        }
    }
}