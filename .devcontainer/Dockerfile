FROM buildpack-deps:bullseye

ARG TZ
ENV TZ=$TZ

ENV USERNAME=tochijihai
ARG UID=1000
ARG GID=$UID

RUN groupadd --gid $GID $USERNAME \
  && useradd --uid $UID --gid $GID --shell /bin/bash --create-home $USERNAME

# Install basic development tools and iptables/ipset
RUN apt update && apt install -y less \
  git \
  procps \
  sudo \
  fzf \
  zsh \
  man-db \
  unzip \
  gnupg2 \
  iptables \
  ipset \
  iproute2 \
  dnsutils \
  jq \
  locales

RUN sed -i -e 's/# \(ja_JP.UTF-8\)/\1/' /etc/locale.gen && \
  locale-gen ja_JP.UTF-8 && \
  update-locale LANG=ja_JP.UTF-8

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

RUN ARCH=$(dpkg --print-architecture) && \
  wget "https://github.com/dandavison/delta/releases/download/0.18.2/git-delta_0.18.2_${ARCH}.deb" && \
  sudo dpkg -i "git-delta_0.18.2_${ARCH}.deb" && \
  rm "git-delta_0.18.2_${ARCH}.deb"

# Set up non-root user
USER $USERNAME

ENV SHELL=/bin/zsh

# Default powerline10k theme
RUN sh -c "$(wget -O- https://github.com/deluan/zsh-in-docker/releases/download/v1.2.0/zsh-in-docker.sh)" -- \
  -p git \
  -p fzf \
  -a "source /usr/share/doc/fzf/examples/key-bindings.zsh" \
  -a "source /usr/share/doc/fzf/examples/completion.zsh" \
  -a "$SNIPPET" \
  -x

# ARG ZSH="~/${USERNAME}/.zshrc"

# RUN if grep -q '^export LANG=' $ZSH; then \
#   sed -i 's|^export LANG=.*|export LANG=ja_JP.UTF-8|' $ZSH \
#   else \
#   echo 'export LANG=ja_JP.UTF-8' >> $ZSH \
#   fi

# RUN if grep -q '^export LANGUAGE==' $ZSH; then \
#   sed -i 's|^export LANGUAGE==.*|export LANGUAGE==ja_JP:ja|' $ZSH \
#   else \
#   echo 'export LANGUAGE==ja_JP:ja' >> $ZSH \
#   fi

# RUN if grep -q '^export LC_ALL==' $ZSH; then \
#   sed -i 's|^export LC_ALL==.*|export LC_ALL==ja_JP.UTF-8|' $ZSH \
#   else \
#   echo 'export LC_ALL==ja_JP.UTF-8' >> $ZSH \
#   fi

# RUN source $ZSH

# Copy and set up script
COPY init.sh /usr/local/bin/
USER root
RUN chmod +x /usr/local/bin/init.sh && \
  echo "${USERNAME} ALL=(root) NOPASSWD: /usr/local/bin/init.sh" > /etc/sudoers.d/firewall && \
  chmod 0440 /etc/sudoers.d/firewall
USER $USERNAME