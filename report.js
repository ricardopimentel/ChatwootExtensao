document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['pdfReportData'], (result) => {
    const data = result.pdfReportData;
    if (!data) {
      alert('Nenhum dado de relatório encontrado.');
      return;
    }

    document.getElementById('agent-name').textContent = `Relatório: ${data.agentName || 'Agente'}`;
    document.getElementById('report-period').textContent = `Período: ${data.periodLabel}`;
    document.getElementById('generation-date').textContent = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;

    document.getElementById('val-messages').textContent = data.messagesSent;
    document.getElementById('val-replied').textContent = data.repliedCount;
    document.getElementById('val-resolved').textContent = data.resolvedCount;
    document.getElementById('val-open').textContent = data.openCount;

    const breakdownBody = document.getElementById('breakdown-body');
    breakdownBody.innerHTML = '';
    if (data.breakdownItems && data.breakdownItems.length > 0) {
      data.breakdownItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${item.name}</strong></td>
          <td>${item.count} ${item.count === 1 ? 'atendimento' : 'atendimentos'}</td>
        `;
        breakdownBody.appendChild(tr);
      });
    } else {
      breakdownBody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: #64748b;">Nenhum atendimento registrado no período.</td></tr>`;
    }

    document.getElementById('productivity-text').innerHTML = data.productivityText;

    // Auto-trigger printing/saving
    setTimeout(() => {
      window.print();
    }, 500);
  });
});
