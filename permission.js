document.getElementById('btn-request').addEventListener('click', () => {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      // Stop stream tracks
      stream.getTracks().forEach(track => track.stop());
      // Close tab once granted
      window.close();
    })
    .catch(err => {
      console.error(err);
      alert('Acesso ao microfone negado. Por favor, ative a permissão nas configurações do seu navegador para esta extensão.');
    });
});

// Auto-request on load
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    stream.getTracks().forEach(track => track.stop());
    window.close();
  })
  .catch(() => {
    // Show instruction if auto-request fails
  });
