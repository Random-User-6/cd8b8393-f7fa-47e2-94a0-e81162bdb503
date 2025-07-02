let parsedArray = [];

$(function () {
  $("#accordion").accordion({
    heightStyle: "content",
    collapsible: true
  });

  $("#renderBtn").on("click", function () {
    const raw = $("#jsonInput").val();
    try {
      parsedArray = JSON.parse(raw);
      if (!Array.isArray(parsedArray)) throw new Error("Input JSON must be an array.");

      const $mods = $("#modules_list").empty();

      parsedArray.forEach((item, index) => {
        const modName = item?.executorState?.moduleName || `Step ${index}`;
        const safeId = `mod_${index}`;
        $mods.append(`<li class="module-link" data-index="${index}" id="${safeId}">${modName}</li>`);
      });

      $(".module-link").on("click", function () {
        const idx = $(this).data("index");
        const state = parsedArray[idx] || {};
        $("#json-viewer").jsonViewer(state, {
          collapsed: false,
          rootCollapsable: false
        });
        $(".module-link").removeClass("selected");
        $(this).addClass("selected");
      });

      // Auto-select first
      $(".module-link").first().trigger("click");
      $("#error_message").text("");
    } catch (err) {
      $("#error_message").text("Invalid JSON: " + err.message);
      $("#json-viewer").empty();
      $("#modules_list").empty();
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
