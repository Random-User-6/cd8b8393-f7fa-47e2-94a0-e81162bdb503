$(document).ready(function () {
  $("#renderBtn").on("click", function () {
    const raw = $("#jsonInput").val();
    try {
      const json = JSON.parse(raw);
      $("#json-viewer").jsonViewer(json, {
        collapsed: false,
        rootCollapsable: false
      });
      $("#error_message").text("");
    } catch (err) {
      $("#json-viewer").empty();
      $("#error_message").text("Invalid JSON: " + err.message);
    }
  });
});
