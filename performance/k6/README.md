# TablePulse AI — Performance & Load Testing with k6

## Prerequisites
To run k6 natively:
1. **Windows (winget)**:
   ```bash
   winget install k6 --source winget
   ```
2. **Windows (Chocolatey)**:
   ```bash
   choco install k6
   ```
3. **macOS (Homebrew)**:
   ```bash
   brew install k6
   ```
4. **Linux (apt)**:
   ```bash
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

---

## Running the k6 Baseline Load Test
Execute against local backend running on `http://localhost:3001`:

```bash
k6 run performance/k6/baseline-300-users.js
```

Or pass custom environment URL:
```bash
k6 run -e BASE_URL=http://localhost:3001 performance/k6/baseline-300-users.js
```

---

## Automated Node.js Load Runner
If k6 is not installed in the operating environment, use the included production load harness:
```bash
node performance/run-baseline-load.js
```
This executes the exact same 300 concurrent Virtual Users across the 60-second window, measures percentile latencies (p50, p90, p95, p99, min, max, avg), computes RPS and error rates, and writes `reports/performance/TablePulse_Baseline_Load_Test_Report.xlsx`.
