import React, { useState } from 'react';

import ReactFlow, {
  removeElements, addEdge, MiniMap, Controls, Handle, Position,
  getBezierPath,
  getEdgeCenter,
  getMarkerEnd,
} from 'react-flow-renderer';

const flowStyles = { height: 500 };
const onLoad = (reactFlowInstance: any) => reactFlowInstance.fitView();

const onElementClick = (event: any, element: any) => console.log('click', element);
const onNodeMouseEnter = (event: any, node: any) => console.log('mouse enter:', node);
const onNodeMouseMove = (event: any, node: any) => console.log('mouse move:', node);
const onNodeMouseLeave = (event: any, node: any) => console.log('mouse leave:', node);
const onNodeContextMenu = (event: any, node: any) => {
  event.preventDefault();
  console.log('context menu:', node);
};

const initialElements: any = [
  {
    id: 'horizontal-1',
    sourcePosition: 'right',
    type: 'input',
    className: 'dark-node',
    data: { label: 'Input' },
    position: { x: 0, y: 80 },
  },
  {
    id: 'horizontal-2',
    sourcePosition: 'right',
    targetPosition: 'left',
    data: { label: 'A Node' },
    position: { x: 250, y: 0 },
  },
  {
    id: 'horizontal-3',
    sourcePosition: 'right',
    targetPosition: 'left',
    data: { label: 'Node 3' },
    position: { x: 250, y: 160 },
  },
  {
    id: 'horizontal-4',
    sourcePosition: 'right',
    targetPosition: 'left',
    data: { label: 'Node 4' },
    position: { x: 500, y: 0 },
  },
  {
    id: 'horizontal-5',
    sourcePosition: 'top',
    targetPosition: 'bottom',
    data: { label: 'Node 5' },
    position: { x: 500, y: 100 },
  },
  {
    id: 'horizontal-6',
    sourcePosition: 'bottom',
    targetPosition: 'top',
    data: { label: 'Node 6' },
    position: { x: 500, y: 230 },
  },
  {
    id: 'horizontal-7',
    sourcePosition: 'right',
    targetPosition: 'left',
    data: { label: 'Node 7' },
    position: { x: 750, y: 50 },
  },
  {
    id: 'horizontal-8',
    sourcePosition: 'right',
    targetPosition: 'left',
    data: { label: 'Node 8' },
    type: 'selectorNode',
    // data: { onChange: onChange, color: initBgColor },
    style: { border: '1px solid #777', padding: 10 },
    position: { x: 750, y: 300 },
  },

  {
    id: 'horizontal-e1-2',
    source: 'horizontal-1',
    type: 'smoothstep',
    target: 'horizontal-2',
    animated: true,
  },
  {
    id: 'horizontal-e1-3',
    source: 'horizontal-1',
    type: 'smoothstep',
    target: 'horizontal-3',
    animated: true,
  },
  {
    id: 'horizontal-e1-4',
    source: 'horizontal-2',
    type: 'smoothstep',
    target: 'horizontal-4',
    label: 'edge label',
    arrowHeadType: 'arrowclosed',
  },
  {
    id: 'horizontal-e3-5',
    source: 'horizontal-3',
    type: 'smoothstep',
    target: 'horizontal-5',
    animated: true,
  },
  {
    id: 'horizontal-e3-6',
    source: 'horizontal-3',
    type: 'smoothstep',
    target: 'horizontal-6',
    animated: true,
  },
  {
    id: 'horizontal-e5-7',
    source: 'horizontal-5',
    type: 'smoothstep',
    target: 'horizontal-7',
    animated: true,
  },
  {
    id: 'horizontal-e6-8',
    source: 'horizontal-6',
    type: 'buttonedge',
    target: 'horizontal-8',
    animated: true,
  },
];

const newNode = {
  id: 'newNode',
  // sourcePosition: 'right',
  // targetPosition: 'left',
  data: { label: 'New Node' },
  position: { x: 800, y: 350 },
}
const newEdge = {
  id: 'horizontal-e7-n',
  source: 'horizontal-6',
  type: 'smoothstep',
  target: 'newNode',
  animated: true,
}


const App = () => {
  const [elements, setElements] = useState<any[]>(initialElements);
  const onElementsRemove = (elementsToRemove: any) =>
    setElements((els: any) => removeElements(elementsToRemove, els));
  const onConnect = (params: any) => setElements((els: any) => addEdge(params, els));
  const deleteNode = () => {
    setElements((elms: any[]) => {
      elms = elms.filter((u: any) => u.id !== newNode.id
      )
      return [...elms]
    });
  };
  const addNode = () => {
    setElements((elms: any[]) => {
      return [...elms, newNode]
    }
    );
  };
  const addEdgeCustom = () => {
    setElements((elms: any[]) => {
      return [...elms, newEdge]
    }
    );
  };
  const deleteEdgeCustom = () => {
    setElements((elms: any[]) => {
      elms = elms.filter((u: any) => u.id !== newEdge.id
      )
      return [...elms]
    });
  };
  const changeClassName = () => {
    setElements((elms: any) =>
      elms.map((el: any) => {
        if (el.type === 'input') {
          el.className = el.className ? '' : 'dark-node';
        }

        return { ...el };
      })
    );
  };

  return (
    <ReactFlow
      elements={elements}
      onElementClick={onElementClick}
      onElementsRemove={onElementsRemove}
      onConnect={onConnect}
      onLoad={onLoad}
      selectNodesOnDrag={false}
      onNodeMouseEnter={onNodeMouseEnter}
      onNodeMouseMove={onNodeMouseMove}
      onNodeMouseLeave={onNodeMouseLeave}
      onNodeContextMenu={onNodeContextMenu}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      style={flowStyles}
    >
      <MiniMap />
      <Controls />
      {/* <button
        onClick={changeClassName}
        style={{ position: 'absolute', right: 10, top: 30, zIndex: 4 }}
      >
        change class name
      </button> */}
      <button
        onClick={addNode}
        style={{ position: 'absolute', right: 10, top: 30, zIndex: 4 }}
      >
        add node
      </button>
      <button
        onClick={deleteNode}
        style={{ position: 'absolute', right: 10, top: 60, zIndex: 4 }}
      >
        delete node
      </button>
      <button
        onClick={addEdgeCustom}
        style={{ position: 'absolute', right: 10, top: 90, zIndex: 4 }}
      >
        add edge
      </button>
      <button
        onClick={deleteEdgeCustom}
        style={{ position: 'absolute', right: 10, top: 120, zIndex: 4 }}
      >
        delete edge
      </button>
    </ReactFlow>
  );
};

export default App;

const ColorSelectorNode = (({ data, isConnectable }: { data: any, isConnectable: boolean }) => {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
        onConnect={(params: any) => console.log('handle onConnect', params)}
        isConnectable={isConnectable}
      />
      <div>
        Custom Color Picker Node: <strong>{data.color}</strong>
      </div>
      <input
        className="nodrag"
        type="color"
        onChange={data.onChange}
        defaultValue={data.color}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="a"
        style={{ top: 10, background: '#555' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="b"
        style={{ bottom: 10, top: 'auto', background: '#555' }}
        isConnectable={isConnectable}
      />
    </>
  );
});

const nodeTypes: any = {
  selectorNode: ColorSelectorNode,
};
const foreignObjectSize = 40;

const onEdgeClick = (evt: any, id: any) => {
  evt.stopPropagation();
  alert(`remove ${id}`);
};
const ButtonEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  arrowHeadType,
  markerEndId,
}: any) => {
  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);
  const [edgeCenterX, edgeCenterY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject
        width={foreignObjectSize}
        height={foreignObjectSize}
        x={edgeCenterX - foreignObjectSize / 2}
        y={edgeCenterY - foreignObjectSize / 2}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <body>
          <button
            className="edgebutton"
            onClick={(event) => onEdgeClick(event, id)}
          >
            ×
          </button>
        </body>
      </foreignObject>
    </>
  );
}
const edgeTypes = {
  buttonedge: ButtonEdge,
};