// script.js

let jsonData = [];
let selectedIndex = -1;

function renderModulesList() {
  const list = document.querySelector(".state_list");
  list.innerHTML = "";

  jsonData.forEach((entry, index) => {
    const li = document.createElement("li");
    li.textContent = entry.executorState?.moduleName || `Step ${index}`;
    li.className = "module-entry";
    li.dataset.index = index;
    li.onclick = () => {
      document.querySelectorAll(".state_list li").forEach(el => el.classList.remove("selected"));
      li.classList.add("selected");
      selectedIndex = index;
      renderStateContent(index);
    };
    list.appendChild(li);
  });
}

function getDifferences(current, previous) {
  const diff = {};
  if (!previous) return current;
  for (const key in current) {
    if (JSON.stringify(current[key]) !== JSON.stringify(previous[key])) {
      diff[key] = current[key];
    }
  }
  return diff;
}

function renderStateContent(index) {
  const viewer = document.getElementById("json-viewer");
  viewer.innerHTML = "";

  const showDiffOnly = document.getElementById("difference").checked;
  const current = jsonData[index];
  const previous = jsonData[index - 1];

  const displayData = {
    variables: showDiffOnly ? getDifferences(current.variables, previous?.variables) : current.variables,
    executorState: current.executorState
  };

  if (typeof $("#json-viewer").jsonViewer === "function") {
    $("#json-viewer").jsonViewer(displayData, { collapsed: false });
  } else {
    viewer.textContent = JSON.stringify(displayData, null, 2);
  }
}

document.getElementById("difference").addEventListener("change", () => {
  if (selectedIndex !== -1) {
    renderStateContent(selectedIndex);
  }
});

document.getElementById("render_btn").addEventListener("click", () => {
  try {
    const input = document.getElementById("json_input").value;
    jsonData = JSON.parse(input);
    selectedIndex = -1;
    renderModulesList();
    document.getElementById("json-viewer").innerHTML = "<p>Select a module to see details</p>";
  } catch (e) {
    alert("Invalid JSON: " + e.message);
  }
});
