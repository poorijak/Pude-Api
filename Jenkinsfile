pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    environment {
        DOCKER_HUB_CREDENTIALS_ID = 'dockerhub-cred'
        DOCKER_REPO               = 'poorijak556/pude-api'

        DEV_APP_NAME              = 'pude-api'
        DEV_HOST_PORT             = '3000'

        PROD_APP_NAME             = 'pude-api-prod'
        PROD_HOST_PORT            = '3000'

        SSH_CREDENTIALS_ID        = 'remote-deploy-pude-api'
        REMOTE_USER               = 'deploy'
        REMOTE_HOST_IP            = '192.168.1.71'
        REMOTE_APP_DIR            = '/home/deploy/apps/pude-api'
    }

    parameters {
        choice(name: 'ACTION', choices: ['Build & Deploy', 'Rollback'], description: 'เลือก Action ที่ต้องการ')
        string(name: 'ROLLBACK_TAG', defaultValue: '', description: 'สำหรับ Rollback: ใส่ Image Tag ที่ต้องการ (เช่น Git Hash หรือ dev-123)')
        choice(name: 'ROLLBACK_TARGET', choices: ['dev', 'prod'], description: 'สำหรับ Rollback: เลือกว่าจะ Rollback ที่ Environment ไหน')
    }

    stages {
        stage('Checkout') {
            when { expression { params.ACTION == 'Build & Deploy' } }
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }

        stage('Build & Push Docker Image') {

            options {
                retry(3)
            }

            when { expression { params.ACTION == 'Build & Deploy' } }
            steps {
                script {
                    def imageTag = (env.BRANCH_NAME == 'main') ? sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim() : "dev-${env.BUILD_NUMBER}"
                    env.IMAGE_TAG = imageTag

                    docker.withRegistry('https://index.docker.io/v1/', DOCKER_HUB_CREDENTIALS_ID) {
                        echo "Building image: ${DOCKER_REPO}:${env.IMAGE_TAG}"
                        def customImage = docker.build("${DOCKER_REPO}:${env.IMAGE_TAG}", '-f Dockerfile --target production .')

                        echo 'Pushing images to Docker Hub...'
                        retry(3) {
                            customImage.push()
                        }
                        if (env.BRANCH_NAME == 'main') {
                            retry(3) {
                                customImage.push('latest')
                            }
                        }
                    }
                }
            }
        }

        stage('Deploy to DEV (Remote Server)') {
            when {
                expression { params.ACTION == 'Build & Deploy' }
                branch 'develop'
            }
            steps {
                script {
                    def deployCmd = """
                        echo 'Deploying container ${DEV_APP_NAME} on REMOTE server...'
                        docker pull ${DOCKER_REPO}:${env.IMAGE_TAG}
                        docker stop ${DEV_APP_NAME} || true
                        docker rm ${DEV_APP_NAME} || true
                        docker run -d --name ${DEV_APP_NAME} -p ${DEV_HOST_PORT}:3000 --env-file ${REMOTE_APP_DIR}/.env -e TZ=Asia/Bangkok --restart unless-stopped ${DOCKER_REPO}:${env.IMAGE_TAG}
                        docker image prune -af || true
                        docker ps --filter name=${DEV_APP_NAME} --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
                    """

                    sshagent(credentials: [env.SSH_CREDENTIALS_ID]) {
                        sh "ssh -o StrictHostKeyChecking=no ${env.REMOTE_USER}@${env.REMOTE_HOST_IP} \"${deployCmd}\""
                    }
                }
            }
        }

        stage('Approval for Production') {
            when {
                expression { params.ACTION == 'Build & Deploy' }
                branch 'main'
            }
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    input message: "Deploy image tag '${env.IMAGE_TAG}' to PRODUCTION (Remote Server: ${REMOTE_HOST_IP} on port ${PROD_HOST_PORT})?"
                }
            }
        }

        stage('Deploy to PRODUCTION (Remote Server)') {
            when {
                expression { params.ACTION == 'Build & Deploy' }
                branch 'main'
            }
            steps {
                script {
                    def deployCmd = """
                        echo 'Deploying container ${PROD_APP_NAME} on REMOTE server...'
                        docker pull ${DOCKER_REPO}:${env.IMAGE_TAG}
                        docker stop ${PROD_APP_NAME} || true
                        docker rm ${PROD_APP_NAME} || true
                        docker run -d --name ${PROD_APP_NAME} -p ${PROD_HOST_PORT}:3000 --env-file ${REMOTE_APP_DIR}/.env -e TZ=Asia/Bangkok --restart unless-stopped ${DOCKER_REPO}:${env.IMAGE_TAG}
                        docker image prune -af || true
                        docker ps --filter name=${PROD_APP_NAME} --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
                    """

                    sshagent(credentials: [env.SSH_CREDENTIALS_ID]) {
                        sh "ssh -o StrictHostKeyChecking=no ${env.REMOTE_USER}@${env.REMOTE_HOST_IP} \"${deployCmd}\""
                    }
                }
            }
        }

        stage('Execute Rollback (Remote)') {
            when { expression { params.ACTION == 'Rollback' } }
            steps {
                script {
                    if (params.ROLLBACK_TAG.trim().isEmpty()) {
                        error "เมื่อเลือก Rollback กรุณาระบุ 'ROLLBACK_TAG'"
                    }

                    def targetAppName = (params.ROLLBACK_TARGET == 'dev') ? DEV_APP_NAME : PROD_APP_NAME
                    def imageToDeploy = "${DOCKER_REPO}:${params.ROLLBACK_TAG.trim()}"

                    echo "ROLLING BACK ${params.ROLLBACK_TARGET.toUpperCase()} on REMOTE server to image: ${imageToDeploy}"

                    def deployCmd = """
                        docker pull ${imageToDeploy}
                        docker stop ${targetAppName} || true
                        docker rm ${targetAppName} || true
                        docker run -d --name ${targetAppName} -p ${params.ROLLBACK_TARGET == 'dev' ? DEV_HOST_PORT : PROD_HOST_PORT}:3000 --env-file ${REMOTE_APP_DIR}/.env -e TZ=Asia/Bangkok --restart unless-stopped ${imageToDeploy}
                        docker image prune -af || true
                    """

                    sshagent(credentials: [env.SSH_CREDENTIALS_ID]) {
                        sh "ssh -o StrictHostKeyChecking=no ${env.REMOTE_USER}@${env.REMOTE_HOST_IP} \"${deployCmd}\""
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                if (params.ACTION == 'Build & Deploy') {
                    echo 'Cleaning up Docker images and build cache on agent...'
                    try {
                        sh """
                            docker image rm -f ${DOCKER_REPO}:${env.IMAGE_TAG} || true
                            docker image rm -f ${DOCKER_REPO}:latest || true
                            docker system prune -f || true
                            docker builder prune -f || true
                        """
                    } catch (err) {
                        echo 'Could not clean up images, but continuing...'
                    }
                }
                echo 'Cleaning up workspace...'
                cleanWs()
            }
        }
    }
}
