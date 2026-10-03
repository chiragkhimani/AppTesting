pipeline {
    agent any

    // Staging only — does not deploy to chiragkhimani.in (production uses GitHub Actions).
    environment {
        HOSTINGER_HOST     = '193.203.185.67'
        HOSTINGER_PORT     = '65002'
        HOSTINGER_USER     = 'u797308362'
        HOSTINGER_TARGET   = '/home/u797308362/domains/seleniumbootcamp.in/public_html'
        SITE_URL           = 'https://seleniumbootcamp.in'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build frontend (seleniumbootcamp root)') {
            steps {
                dir('frontend') {
                    script {
                        if (isUnix()) {
                            sh '''
                                set -euo pipefail
                                command -v node >/dev/null || { echo "Node.js is required on the Jenkins agent."; exit 1; }

                                cat > .env.production.local <<'EOF'
PUBLIC_URL=/
REACT_APP_API_BASE=/api
REACT_APP_ROUTER_BASENAME=
EOF

                                corepack enable 2>/dev/null || true
                                corepack prepare yarn@1.22.22 --activate
                                yarn install --frozen-lockfile
                                yarn build
                            '''
                        } else {
                            bat '''
                                @echo off
                                setlocal
                                where node >nul 2>&1 || (echo Node.js is required on the Jenkins agent. & exit /b 1)
                                (
                                  echo PUBLIC_URL=/
                                  echo REACT_APP_API_BASE=/api
                                  echo REACT_APP_ROUTER_BASENAME=
                                ) > .env.production.local
                                call corepack enable
                                call corepack prepare yarn@1.22.22 --activate
                                call yarn install --frozen-lockfile
                                call yarn build
                            '''
                        }
                    }
                }
            }
        }

        stage('Deploy to Hostinger (seleniumbootcamp.in)') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'SSH',
                        keyFileVariable: 'KEYFILE',
                        usernameVariable: 'SSH_USERNAME'
                    )
                ]) {
                    sh '''
                        set -euo pipefail
                        command -v ssh >/dev/null || { echo "OpenSSH ssh is required (Windows: optional feature OpenSSH Client)."; exit 1; }
                        command -v scp >/dev/null || { echo "OpenSSH scp is required."; exit 1; }

                        chmod 600 "$KEYFILE" 2>/dev/null || true

                        SSH="ssh -i \\"$KEYFILE\\" -p $HOSTINGER_PORT -o StrictHostKeyChecking=accept-new"
                        SCP="scp -i \\"$KEYFILE\\" -P $HOSTINGER_PORT -o StrictHostKeyChecking=accept-new"
                        REMOTE="$HOSTINGER_USER@$HOSTINGER_HOST"

                        # Full replace of site root (same idea as your old rm -fr * + clone)
                        $SSH "$REMOTE" "rm -rf ${HOSTINGER_TARGET}/*"

                        $SSH "$REMOTE" "mkdir -p ${HOSTINGER_TARGET}/api ${HOSTINGER_TARGET}/swagger"

                        $SCP -r frontend/build/* "$REMOTE:${HOSTINGER_TARGET}/"
                        $SCP -r hostinger-deploy/api/* "$REMOTE:${HOSTINGER_TARGET}/api/"
                        $SCP -r hostinger-deploy/swagger/* "$REMOTE:${HOSTINGER_TARGET}/swagger/"
                        $SCP hostinger-deploy/.htaccess.seleniumbootcamp "$REMOTE:${HOSTINGER_TARGET}/.htaccess"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Staging deployed: ${SITE_URL}"
        }
        failure {
            echo 'Build or deploy failed. Production (chiragkhimani.in) was not touched.'
        }
    }
}
