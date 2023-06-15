import { Color } from 'three';
import { IfcViewerAPI } from 'web-ifc-viewer';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });

// Create grid and axes
viewer.grid.setGrid();
viewer.axes.setAxes();

let model;

async function loadIfc(url) {
		// Load the model
    model = await viewer.IFC.loadIfcUrl(url);

		// Add dropped shadow and post-processing efect
    await viewer.shadowDropper.renderShadow(model.modelID);
    
    viewer.context.renderer.postProduction.active = true;

    //Get spatial tree
    const project = await viewer.IFC.getSpatialStructure(model.modelID);
    
    console.log(project);

    createTreeMenu(project);
}
loadIfc('./01.ifc');


//window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();

window.ondblclick = async () => {
  const found = await viewer.IFC.selector.pickIfcItem();
  const result1 = await viewer.IFC.loader.ifcManager.getItemProperties(found.modelID, found.id);
  console.log(result1);
}


//Spatial tree
function createTreeMenu(ifcProject){
  const root = document.getElementById("tree-root");
  removeAllChildren(root);
  const ifcProjectNode = createNestedChild(root, ifcProject);
  for (const child of ifcProject.children){
    constructTreeMenuNode(ifcProjectNode, child);
  }
}

function constructTreeMenuNode(parent, node){
  const children = node.children;
  if (children.length === 0){
    createSimpleChild(parent, node);
    return;
  }
  const nodeElement = createNestedChild(parent, node);
  for (const child of children){
    constructTreeMenuNode(nodeElement, child);
  }
}

function createSimpleChild(parent, node){
  const content = nodeToSring(node);
  const childNode = document.createElement('li');
  childNode.classList.add('leaf-node');
  childNode.textContent = content;
  parent.appendChild(childNode);

  childNode.onmouseenter = () => {
    viewer.IFC.selector.prepickIfcItemsByID(model.modelID, [node.expressID]);
  }
  
}

function createNestedChild(parent, node){
  const content = nodeToSring(node);
  const root = document.createElement("li");
  createTitle(root, content);
  const childrenContainer = document.createElement('ul');
  childrenContainer.classList.add('nested');
  root.appendChild(childrenContainer);
  parent.appendChild(root);
  return childrenContainer;

}

function createTitle(parent, content){
  const title = document.createElement('span');
  title.classList.add('caret');
  title.onclick = () => {
    title.parentElement.querySelector(".nested").classList.toggle('active');
    title.classList.toggle('caret-down');
  }

  title.textContent = content;
  parent.appendChild(title);
}

function nodeToSring(node){
  return `${node.type} - ${node.expressID}`
}

function removeAllChildren(element){
  while(element.firstChild) {
    element.removeChild(element.firstChild);
  }
} 

window.onclick = async () => {
  const result = await viewer.IFC.selector.highlightIfcItem();
  if (!result) return;
  const { modelID, id } = result;
  const props = await viewer.IFC.getProperties(modelID, id, true, false);
  createPropertiesMenu(props);
};

const propsGUI = document.getElementById("ifc-property-menu-root");

function createPropertiesMenu(properties) {
  console.log(properties);

  removeAllChildren(propsGUI);

  delete properties.psets;
  delete properties.mats;
  delete properties.type;


  for (let key in properties) {
      createPropertyEntry(key, properties[key]);
  }

  function createPropertyEntry(key, value) {
    const propContainer = document.createElement("div");
    propContainer.classList.add("ifc-property-item");

    if(value === null || value === undefined) value = "undefined";
    else if(value.value) value = value.value;

    const keyElement = document.createElement("div");
    keyElement.textContent = key;
    propContainer.appendChild(keyElement);

    const valueElement = document.createElement("div");
    valueElement.classList.add("ifc-property-value");
    valueElement.textContent = value;
    propContainer.appendChild(valueElement);

    propsGUI.appendChild(propContainer);
  }

  function removeAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
  }
}