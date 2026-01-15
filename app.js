ws.onmessage = (e) => {
  try {
    const data = JSON.parse(e.data);

    // ❗ Sadece content_updated action'ı geldiğinde fetch çalışacak
    if (data.type === "command" && data.action === "content_updated") {
      toastr.success(data.message || "İçerikler güncellendi");
      fetchScreenContents();  // içerikleri tekrar çek
    }

    // İleride başka action tipleri eklenirse buraya yazabilirsin
    // if (data.type === "command" && data.action === "bind") { ... }

  } catch (err) {
    console.log("WS JSON error", err);
  }
};
