var DebugUI = {};
DebugUI.showChangedVarsOnly = false;
DebugUI.script_info_table = undefined;
DebugUI.init_params_table = undefined;

$( function() {

	// init sections:
    $( ".resizable" ).resizable({
      resize: function( event, ui ) {
    	 DebugUI.resizeSections(ui.element, ui.size.width);
    	 $( "#accordion" ).accordion( "refresh" );
 	  }
	});

    $( "#accordion" ).accordion({
      collapsible: true
    });

    DebugUI.script_info_table = $('#script_info_table').DataTable({
        paging: false,
        searching: false,
        info: false,
        ordering: false
    });

    DebugUI.init_params_table = $('#init_params_table').DataTable({
        paging: false,
        searching: false,
        info: false
    });

	var statesSection = $("#navigate_section");
	DebugUI.resizeSections(statesSection, statesSection.width());
	DebugUI.showChangedVarsOnly = localStorage["showChangedVarsOnly"];
	if(DebugUI.showChangedVarsOnly === 'true'){
		DebugUI.showChangedVarsOnly = true;
	}

	$("#difference").prop('checked', DebugUI.showChangedVarsOnly);
	$("#difference" ).change(function(){
		DebugUI.onDiffChanged();
	});

    $("#init_params_table").hide();

    $("#save_btn").on("click", function(item) {
        DebugController.saveToFile("five9_ivr_debug_session.txt");
    });
	// end init sections
});

DebugUI.onDiffChanged = function (){
	DebugUI.showChangedVarsOnly = $( "#difference" ).is(':checked');
	localStorage["showChangedVarsOnly"] = DebugUI.showChangedVarsOnly;
	DebugUI.redrawJsonTree();
	DebugUI.updateUI();
}

DebugUI.updateUI = function(){
	 $( "#accordion" ).accordion( "refresh" );
}

DebugUI.resizeSections = function(statesElement, newWidth){
	var widthPersent = newWidth / statesElement.parent().width() *100;
    widthPersent = Math.max(widthPersent, parseInt(statesElement.css("min-width")));
    widthPersent = Math.min(widthPersent, parseInt(statesElement.css("max-width")));
    $("#tree_section").css("width", (95 - widthPersent) + "%");
    DebugUI.updateUI();
}


DebugUI.displayError = function(description) {
	var message = $( "#error_message" );
	message.text(description);
}

DebugUI.displayStatus = function (status) {
	var currentdate = new Date();
	var datetime = "Last Sync: " + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
	var currentStatus = document.getElementById('currentstatus');
	currentStatus.value = datetime;
}

DebugUI.updateJsonView = function(input){

	if(typeof input === "string"){
		try {
	      var input = eval('(' + input + ')');
	    }
	    catch (error) {
	      return alert("Cannot eval JSON: " + error);
	    }
	}
    var options = {
      collapsed: false,
      withQuotes: false,
      onClickEvent:DebugUI.onJsonTreeClick
    };
    $('#json-viewer').jsonViewer(input, options);
}

DebugUI.notifyStateListener = function(index){
	var updatedState = DebugController.states[index];
	DebugUI.createListItem(updatedState, index);
	DebugUI.setActiveListItem(index);
	DebugUI.updateUI();
}

DebugUI.createListItem = function (itemData, index) {
	var list = $("ul.state_list li");
	var newItem = $('<li class="state_list_item">'+itemData.executorState.moduleName+'</li>');
	if(list.length === 0 || index >= list.length){
		$("ul.state_list").append(newItem);
	} else {
		$("ul.state_list li:eq("+ (index)+")").before(newItem);
	}

    if (itemData.executorState.exceptionExit) {
        newItem.css('color', 'red')
    }

	$("ul.state_list li").off("click");
	$("ul.state_list li").on("click", function(item) {
  		DebugUI.setActiveListItem($(item.target).index());
	});

}

DebugUI.setActiveListItem = function(index){
	$(".state_list_item").removeClass("active");
	var item  = $(".state_list_item").get(index);
	$(item).addClass("active");
	DebugUI.updateJsonTree(index);
}

DebugUI.updateJsonTree = function(index){
	var state = DebugController.states[index];
	if(state){
		if(index > 0 && DebugUI.showChangedVarsOnly){
			DebugUI.updateJsonView(DebugUI.getOnlyDifferenceVariables(state,  DebugController.states[index-1]));
		} else {
			DebugUI.updateJsonView(state);
		}
	}

}

DebugUI.redrawJsonTree = function(){

	var index = $("ul.state_list li.active").index();
	if(index === undefined){
		index = DebugController.states.length -1;
	}
	DebugUI.updateJsonTree(index);

}


DebugUI.notifyStaticData = function(staticData) {
    DebugUI.insertIntoTable(DebugUI.script_info_table, "Campaign", staticData.campaignName);
    DebugUI.insertIntoTable(DebugUI.script_info_table, "Script name", staticData.scriptName);
    DebugUI.insertIntoTable(DebugUI.script_info_table, "Media type", staticData.mediaType);

    if (Object.entries(staticData.inputParams).length > 0) {
        $("#init_params_table").show();
    }

    for (const [key, value] of Object.entries(staticData.inputParams)) {
        DebugUI.insertIntoTable(DebugUI.init_params_table, key, value);
        Five9Common.debug(`Init params: ${key} = ${value}`);
    }
}

DebugUI.onJsonTreeClick = function(){
	DebugUI.updateUI();
}

DebugUI.getOnlyDifferenceVariables = function(original, prev){
	if(!original || !prev || !original.variables || !prev.variables){
		return original;
	}

	var difObject = Object.assign({}, original);
	difObject.variables = Object.assign({}, original.variables);
	var vars = original.variables;

	for (var property in vars) {
    	if (vars.hasOwnProperty(property)) {
        	if(vars[property] === prev.variables[property]){
        		delete difObject.variables[property];
        	}
    	}
	}
    return difObject;


}

DebugUI.insertIntoTable = function (table, key, value) {
    if (typeof key === 'undefined' || typeof value === 'undefined') {
        return;
    }

    var tIndex = -1;
    table.rows().every(function (rowIdx, tableLoop, rowLoop) {
        var data = this.data();
        if (data[0] === key) {
            tIndex = rowIdx;
        }
    });

    if (tIndex != -1) {
        table.row(tIndex).data([key, value]).draw();
    } else {
        table.row.add([key, value]).draw();
    }
}

DebugUI.removeFromTable = function (table, key) {
    var tIndex = -1;
    table.rows().every(function (rowIdx, tableLoop, rowLoop) {
        var data = this.data();
        if (data[0] === key) {
            tIndex = rowIdx;
        }
    });

    if (tIndex != -1) {
        table.row(tIndex).remove().draw();
    }
}

DebugUI.replaceTag = function (tag) {
    return DebugUI.tagsToReplace[tag] || tag;
}

DebugUI.escapeTags = function (str) {
    return str.replace(/[&<>]/g, DebugUI.replaceTag);
}
