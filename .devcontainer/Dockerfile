FROM node:24-alpine as node
FROM python:3.13-alpine as python
FROM golang:1.24-alpine as golang
FROM alpine

# Install 適当 pkg and iptables/ipset
RUN apk update && apk add --no-cache \
  less \
  git \
  curl \
  procps \
  sudo \
  dpkg \
  fzf \
  bash \
  zsh \
  zsh-autosuggestions \
  zsh-syntax-highlighting \
  man-db \
  unzip \
  iptables \
  ipset \
  iproute2 \
  jq \
  delta \
  aws-cli

# Add non-root user
ENV USERNAME tochijihai

RUN addgroup -S $USERNAME \
  && adduser -S $USERNAME -G $USERNAME
# && echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers 

# Install node
COPY --from=node /usr/local/bin /usr/local/bin
COPY --from=node /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
COPY --from=node /opt/yarn* /opt/yarn
RUN ln -fs /opt/yarn/bin/yarn /usr/local/bin/yarn && \
  ln -fs /opt/yarn/bin/yarnpkg /usr/local/bin/yarnpkg

# Install python
RUN apk add --no-cache expat

COPY --from=python /usr/local/bin /usr/local/bin
COPY --from=python /usr/local/lib /usr/local/lib
COPY --from=python /usr/local/include /usr/local/include

# Install golang
COPY --from=golang /usr/local/go /usr/local/go
ENV PATH $PATH:/usr/local/go/bin/

# Persist bash history.
ENV SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history"
RUN mkdir /commandhistory \
  && touch /commandhistory/.bash_history \
  && chown -R $USERNAME /commandhistory

# Set `DEVCONTAINER` environment variable to help with orientation
ENV DEVCONTAINER=true

# Create workspace and config directories and set permissions
RUN mkdir -p /workspaces /home/$USERNAME/.claude && \
  chown -R $USERNAME:$USERNAME /workspaces /home/$USERNAME/.claude

# Set up non-root user
USER $USERNAME

# Set up zsh 
ENV SHELL=/bin/zsh
RUN sh -c "$(wget https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O -)"
RUN echo "source /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" >> ~/.zshrc && \
  echo "source /usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh" >> ~/.zshrc

COPY init.sh /usr/local/bin/
USER root
RUN chmod +x /usr/local/bin/init.sh && \
  echo "${USERNAME} ALL=(root) NOPASSWD: /usr/local/bin/init.sh" > /etc/sudoers.d/init && \
  chmod 0440 /etc/sudoers.d/init

# Clean up
RUN rm -rf /var/cache/apk/*