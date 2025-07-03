let parsedArray = [];
let currentIndex = 0;

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
        $mods.append(`<li class="module-link" data-index="${index}">${modName}</li>`);
      });

      $(".module-link").on("click", function () {
        const index = $(this).data("index");
        currentIndex = index;
        renderVariables(index);
        $(".module-link").removeClass("selected");
        $(this).addClass("selected");
      });

      // Trigger the first row
      $(".module-link").first().trigger("click");

      $("#error_message").text("");
    } catch (err) {
      $("#error_message").text("Invalid JSON: " + err.message);
      $("#json-viewer").empty();
      $("#modules_list").empty();
    }
  });

  $("#difference").on("change", function () {
    renderVariables(currentIndex);
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

// 🔧 Main renderer with diff support
function renderVariables(index) {
  const current = parsedArray[index]?.variables || {};
  const prev = index > 0 ? parsedArray[index - 1]?.variables || {} : {};

  const showAll = !$("#difference").is(":checked");

  let result;

  if (showAll || index === 0) {
    result = current;
  } else {
    result = {};
    Object.entries(current).forEach(([key, value]) => {
      if (prev[key] !== value) {
        result[key] = value;
      }
    });
  }

  $("#json-viewer").jsonViewer(result, {
    collapsed: false,
    rootCollapsable: false
  });
}
