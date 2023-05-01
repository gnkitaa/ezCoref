
let inverseOperationMap = {
    "previousTarget": "nextTarget",
    "nextTarget": "previousTarget",
    "leftClick": "leftClick",
    "rightClick": "leftClick",
    "skipClick": "leftClick",
    "createTarget": "deleteTarget",
    "deleteTarget": "createTarget"
};

let nameMap = {
    "previousTarget": "go to previous target",
    "nextTarget": "go to next target",
    "leftClick": "left click",
    "rightClick": "right click",
    "skipClick": "right click and skip target",
    "createTarget": "create new target",
    "deleteTarget": "delete target"
}

export class Operation {
    constructor(operationType, operationMetadata, inverse = null) {
        this.operationType = operationType;
        this.operationMetadata = operationMetadata;
        this.inverse = inverse;
        this.name = nameMap[operationType];
    }
    setInverse = (inverse) => {
        this.inverse = inverse;
    }
}

export let getOperation = (operationType, operationMetadata, inverseOperationMetadata) => {
    let operation = new Operation(operationType, operationMetadata);
    operation.setInverse(getInverseOperation(operation, inverseOperationMetadata));
    return operation;
}

let getInverseOperation = (operation, inverseOperationMetadata) => {
    if (typeof inverseOperationMetadata !== 'undefined' && typeof inverseOperationMetadata.spansClicked !== 'undefined'){
        //AG : special case when already marked span is clicked with new entity, followed by undo
        return new Operation(
            inverseOperationMap[operation.operationType],
            inverseOperationMetadata,
            operation
        );
    }
    else{
        return new Operation(
            inverseOperationMap[operation.operationType],
            operation.operationMetadata,
            operation
        );
    }
}
