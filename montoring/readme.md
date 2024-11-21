## to install all these services use my own install script wite menu

```bash
	git clone https://github.com/fchristian1/grafana_and_friends_install_scripts.git
    cd grafana_and_friends_install_scripts
    ./install
```

### service names
 - loki
 - prometheus
 - promtail
 - node_exporter

copy config to /etc/<servicename>/consfig.yml

copy prometheus.service to /etc/systemd/system/<servicename>.service

```bash
sudo systemctl dameon-realod
sudo systemctl start <servicename>
sudo systemctl enable <servicename>
```
