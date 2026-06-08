$pids = Get-Process node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id
foreach ($pid in $pids) {
  $conns = Get-NetTCPConnection -OwningProcess $pid -ErrorAction SilentlyContinue
  if ($conns) {
    Write-Output "PID: $pid"
    $conns | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State | Format-Table -AutoSize
  }
}
