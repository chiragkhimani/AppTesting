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
                    sh '''
                        set -euo pipefail
                        command -v node >/dev/null || { echo "Node.js is required on the Jenkins agent."; exit 1; }
                        command -v rsync >/dev/null || { echo "rsync is required on the Jenkins agent."; exit 1; }

                        # Root-site build: /api, assets at /, React router at /
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
                        chmod 600 "$KEYFILE"

                        SSH_BASE="-i $KEYFILE -p $HOSTINGER_PORT -o StrictHostKeyChecking=accept-new"
                        RSYNC_RSH="ssh $SSH_BASE"
                        DEST="$HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_TARGET"

                        rsync -az --delete \
                          --exclude api/ \
                          --exclude swagger/ \
                          --exclude .htaccess \
                          -e "$RSYNC_RSH" \
                          frontend/build/ \
                          "$DEST/"

                        rsync -az --delete \
                          -e "$RSYNC_RSH" \
                          hostinger-deploy/api/ \
                          "$DEST/api/"

                        rsync -az --delete \
                          -e "$RSYNC_RSH" \
                          hostinger-deploy/swagger/ \
                          "$DEST/swagger/"

                        scp -i "$KEYFILE" -P "$HOSTINGER_PORT" \
                          -o StrictHostKeyChecking=accept-new \
                          hostinger-deploy/.htaccess.seleniumbootcamp \
                          "$HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_TARGET/.htaccess"
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
