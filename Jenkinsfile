@Library('devops-shared-library') _

pipeline {
    agent any

    options {
        timeout(time: 60, unit: 'MINUTES')
    }

    triggers {
        pollSCM('* * * * *') // every 1 minute for demo; use webhook in production
    }

    environment {
        DOCKER_IMAGE       = 'raetng/product'
        DOCKER_CREDENTIALS = 'dockerhub-credentials'
        PATH               = "/Users/raetng/.nvm/versions/node/v24.11.0/bin:/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.GIT_BRANCH_NAME = env.BRANCH_NAME ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    env.IMAGE_TAG = resolveImageTag()
                    env.DEPLOY_NAMESPACE = resolveNamespace()
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run lint --if-present'
                // TODO: Add any additional build/compile steps if needed
            }
        }

        stage('Test') {
            steps {
                runTests(testCommand: 'npm test -- --ci --reporters=default --reporters=jest-junit', resultPath: 'test-results/')
            }
        }

        stage('Secret Detection') {
            steps {
                gitleaksScan()
            }
        }

        stage('Container Build') {
            steps {
                script {
                    dockerBuildAndTag(imageName: DOCKER_IMAGE, tag: env.IMAGE_TAG)
                }
            }
        }

        stage('Image Security Scan') {
            steps {
                script {
                    def threshold = (env.DEPLOY_NAMESPACE == 'staging' || env.DEPLOY_NAMESPACE == 'prod') ? 'HIGH' : 'CRITICAL'
                    securityScan(imageName: DOCKER_IMAGE, tag: env.IMAGE_TAG, severityThreshold: threshold)
                }
            }
        }

        stage('Container Push') {
            when {
                anyOf {
                    branch 'develop'
                    branch pattern: 'release/*', comparator: 'GLOB'
                    branch 'main'
                }
            }
            steps {
                script {
                    dockerPush(imageName: DOCKER_IMAGE, tag: env.IMAGE_TAG, credentialsId: DOCKER_CREDENTIALS)
                }
            }
        }

        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    kubernetesDeploy(
                        namespace: 'dev',
                        manifestPath: "k8s/product/",
                        imageTag: env.IMAGE_TAG
                    )
                }
            }
        }

        stage('Deploy to Staging') {
            when {
                branch pattern: 'release/*', comparator: 'GLOB'
            }
            steps {
                script {
                    kubernetesDeploy(
                        namespace: 'staging',
                        manifestPath: "k8s/product/",
                        imageTag: env.IMAGE_TAG
                    )
                }
            }
        }

        stage('Deploy to Prod') {
            when {
                branch 'main'
            }
            steps {
                timeout(time: 30, unit: 'MINUTES') {
                    input message: 'Approve deployment to production?', ok: 'Deploy'
                }
                script {
                    kubernetesDeploy(
                        namespace: 'prod',
                        manifestPath: "k8s/product/",
                        imageTag: env.IMAGE_TAG
                    )
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '**/trivy-report-*.json,**/trivy-report-*.txt,**/gitleaks-report.json,**/test-results/**', allowEmptyArchive: true
            cleanWs()
        }
        failure {
            echo "Pipeline failed for ${DOCKER_IMAGE}:${env.IMAGE_TAG}"
            // TODO: Add notification (Slack, email, etc.)
        }
    }
}

def resolveImageTag() {
    def branch = env.GIT_BRANCH_NAME

    if (branch == 'main' || branch == 'master') {
        if (!fileExists('VERSION')) {
            error('VERSION file not found. Required for production tagging.')
        }
        def version = readFile('VERSION').trim()
        return "v${version}"
    } else if (branch.startsWith('release/')) {
        return "rc-${env.GIT_COMMIT_SHORT}"
    } else if (env.CHANGE_ID) {
        return "pr-${env.CHANGE_ID}-${env.GIT_COMMIT_SHORT}"
    } else {
        return "dev-${env.GIT_COMMIT_SHORT}"
    }
}

def resolveNamespace() {
    def branch = env.GIT_BRANCH_NAME

    if (branch == 'main' || branch == 'master') {
        return 'prod'
    } else if (branch.startsWith('release/')) {
        return 'staging'
    } else {
        return 'dev'
    }
}
