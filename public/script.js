$(function () {
  $("#accordion").accordion({
    heightStyle: "content",
    collapsible: true
  });

  $("#renderBtn").on("click", function () {
    const raw = $("#jsonInput").val();
    try {
      const data = JSON.parse(raw);

      // Fill Script Info
      $("#campaign_cell").text(data?.scriptInfo?.campaign || "--");
      $("#script_name_cell").text(data?.scriptInfo?.scriptName || "--");
      $("#media_type_cell").text(data?.scriptInfo?.mediaType || "--");

      // Fill Initial Params
      const $init = $("#init_params_table tbody").empty();
      if (data.initialParams) {
        Object.entries(data.initialParams).forEach(([k, v]) => {
          $init.append(`<tr><td>${k}</td><td>${v}</td></tr>`);
        });
      }

      // Fill Modules
      const $mods = $("#modules_list").empty();
      (data.modules || []).forEach(m => {
        $mods.append(`<li>${m}</li>`);
      });

      // Render JSON state content
      $("#json-viewer").jsonViewer(data.stateContent || {}, {
        collapsed: false,
        rootCollapsable: false
      });

      $("#error_message").text("");

    } catch (e) {
      $("#error_message").text("Invalid JSON: " + e.message);
    }
  });

  $("#save_btn").on("click", function () {
    const blob = new Blob([$("#jsonInput").val()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ivr_debug.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});
