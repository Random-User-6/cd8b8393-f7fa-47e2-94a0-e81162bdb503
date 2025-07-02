// Sample data
const debugData = {
  scriptInfo: {
    campaign: "csbbo_asvs_atmsupport_controlcenter",
    scriptName: "csbbo_asvs_atmsupport_inbound",
    mediaType: "voice"
  },
  initialParams: {
    "Routing.calls_in_queue": "0",
    "IVR.last_module": "99_SkillTransfer",
    "Call.language": "en-US"
  },
  modules: [
    "10.10_set_target_lob",
    "20.10_set_target_name",
    "30.10_goto_fs_primary_processor",
    "**START** in_fs_sip_uui_lookup",
    "00.10_get_XHeaders",
    "00.20_get_X-1"
  ],
  stateContent: {
    variables: {
      "Enterprise.skill": "csbbo_asvs_atmsupport_controlcenter",
      "Routing.calls_in_queue": "0",
      "Call.language": "en-US"
    },
    executorState: {
      moduleName: "99_SkillTransfer",
      moduleType: "SkillTransfer",
      exceptionExit: false
    }
  }
};

$(document).ready(function () {
  // Fill script info
  $("#campaign_cell").text(debugData.scriptInfo.campaign);
  $("#script_name_cell").text(debugData.scriptInfo.scriptName);
  $("#media_type_cell").text(debugData.scriptInfo.mediaType);

  // Fill initial params table
  const $initParams = $("#init_params_table tbody");
  $.each(debugData.initialParams, function (key, val) {
    $initParams.append(`<tr><td>${key}</td><td>${val}</td></tr>`);
  });

  // Fill module list
  const $modulesList = $("#modules_list");
  debugData.modules.forEach((mod) => {
    $modulesList.append(`<li>${mod}</li>`);
  });

  // Render JSON
  $("#json-viewer").jsonViewer(debugData.stateContent, {
    collapsed: false,
    rootCollapsable: false
  });

  // Save to file
  $("#save_btn").on("click", function () {
    const blob = new Blob([JSON.stringify(debugData.stateContent, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ivr_debug_output.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

    // Paste & Render button logic
  $("#renderBtn").on("click", function () {
    const input = $("#jsonInput").val();
    try {
      const parsed = JSON.parse(input);
      $("#json-viewer").jsonViewer(parsed, {
        collapsed: false,
        rootCollapsable: false
      });
      $("#error_message").text("");
    } catch (e) {
      $("#error_message").text("Invalid JSON: " + e.message);
    }
  });

});
