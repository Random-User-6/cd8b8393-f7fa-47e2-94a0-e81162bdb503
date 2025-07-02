$(document).ready(function () {
  $('#renderBtn').on('click', function () {
    const rawJson = $('#jsonInput').val();
    try {
      const json = JSON.parse(rawJson);
      $('#json-viewer').jsonViewer(json, { collapsed: false, rootCollapsable: false });
    } catch (e) {
      $('#json-viewer').html('<span style="color:red;">Invalid JSON</span>');
    }
  });
});
