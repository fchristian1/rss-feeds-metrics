copy config to /etc/prometheus/consfig.yml

copy prometheus.service to /etc/systemd/system/prometheus.service

```bash
sudo systemctl dameon-realod
sudo systemctl start prometheus
sudo systemctl enable prometheus
```
