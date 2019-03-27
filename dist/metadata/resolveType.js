"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const metadataGenerator_1 = require("./metadataGenerator");
const decoratorUtils_1 = require("../utils/decoratorUtils");
const jsDocUtils_1 = require("../utils/jsDocUtils");
const _ = require("lodash");
const syntaxKindMap = {};
syntaxKindMap[ts.SyntaxKind.NumberKeyword] = 'number';
syntaxKindMap[ts.SyntaxKind.StringKeyword] = 'string';
syntaxKindMap[ts.SyntaxKind.BooleanKeyword] = 'boolean';
syntaxKindMap[ts.SyntaxKind.VoidKeyword] = 'void';
const localReferenceTypeCache = {};
const inProgressTypes = {};
function resolveType(typeNode, genericTypeMap) {
    if (!typeNode) {
        return { typeName: 'void' };
    }
    const primitiveType = getPrimitiveType(typeNode);
    if (primitiveType) {
        return primitiveType;
    }
    if (typeNode.kind === ts.SyntaxKind.ArrayType) {
        const arrayType = typeNode;
        return {
            elementType: resolveType(arrayType.elementType, genericTypeMap),
            typeName: 'array'
        };
    }
    if ((typeNode.kind === ts.SyntaxKind.UnionType) || (typeNode.kind === ts.SyntaxKind.AnyKeyword) || (typeNode.kind === ts.SyntaxKind.ObjectKeyword)) {
        return { typeName: 'object' };
    }
    if (typeNode.kind === ts.SyntaxKind.TypeLiteral) {
        return getInlineObjectType(typeNode);
    }
    if (typeNode.kind !== ts.SyntaxKind.TypeReference) {
        throw new Error(`Unknown type: ${ts.SyntaxKind[typeNode.kind]}`);
    }
    let typeReference = typeNode;
    let typeName = resolveSimpleTypeName(typeReference.typeName);
    if (typeName === 'Date') {
        return getDateType(typeNode);
    }
    if (typeName === 'Buffer') {
        return { typeName: 'buffer' };
    }
    if (typeName === 'DownloadBinaryData') {
        return { typeName: 'buffer' };
    }
    if (typeName === 'DownloadResource') {
        return { typeName: 'buffer' };
    }
    if (typeName === 'Promise') {
        typeReference = typeReference.typeArguments[0];
        return resolveType(typeReference, genericTypeMap);
    }
    if (typeName === 'Array') {
        typeReference = typeReference.typeArguments[0];
        return {
            elementType: resolveType(typeReference, genericTypeMap),
            typeName: 'array'
        };
    }
    const enumType = getEnumerateType(typeNode);
    if (enumType) {
        return enumType;
    }
    const literalType = getLiteralType(typeNode);
    if (literalType) {
        return literalType;
    }
    let referenceType;
    if (typeReference.typeArguments && typeReference.typeArguments.length === 1) {
        const typeT = typeReference.typeArguments;
        referenceType = getReferenceType(typeReference.typeName, genericTypeMap, typeT);
        typeName = resolveSimpleTypeName(typeReference.typeName);
        if (['NewResource', 'RequestAccepted', 'MovedPermanently', 'MovedTemporarily'].indexOf(typeName) >= 0) {
            referenceType.typeName = typeName;
            referenceType.typeArgument = resolveType(typeT[0], genericTypeMap);
        }
        else {
            metadataGenerator_1.MetadataGenerator.current.addReferenceType(referenceType);
        }
    }
    else {
        referenceType = getReferenceType(typeReference.typeName, genericTypeMap);
        metadataGenerator_1.MetadataGenerator.current.addReferenceType(referenceType);
    }
    return referenceType;
}
exports.resolveType = resolveType;
function getPrimitiveType(typeNode) {
    const primitiveType = syntaxKindMap[typeNode.kind];
    if (!primitiveType) {
        return;
    }
    if (primitiveType === 'number') {
        const parentNode = typeNode.parent;
        if (!parentNode) {
            return { typeName: 'double' };
        }
        const validDecorators = ['IsInt', 'IsLong', 'IsFloat', 'IsDouble'];
        const jsdocTagName = jsDocUtils_1.getFirstMatchingJSDocTagName(parentNode, tag => {
            return validDecorators.some(t => t === tag.tagName.text);
        });
        const decoratorName = decoratorUtils_1.getDecoratorName(parentNode, identifier => {
            return validDecorators.some(m => m === identifier.text);
        });
        switch (decoratorName || jsdocTagName) {
            case 'IsInt':
                return { typeName: 'integer' };
            case 'IsLong':
                return { typeName: 'long' };
            case 'IsFloat':
                return { typeName: 'float' };
            case 'IsDouble':
                return { typeName: 'double' };
            default:
                return { typeName: 'double' };
        }
    }
    return { typeName: primitiveType };
}
function getDateType(typeNode) {
    const parentNode = typeNode.parent;
    if (!parentNode) {
        return { typeName: 'datetime' };
    }
    const decoratorName = decoratorUtils_1.getDecoratorName(parentNode, identifier => {
        return ['IsDate', 'IsDateTime'].some(m => m === identifier.text);
    });
    switch (decoratorName) {
        case 'IsDate':
            return { typeName: 'date' };
        case 'IsDateTime':
            return { typeName: 'datetime' };
        default:
            return { typeName: 'datetime' };
    }
}
function getEnumerateType(typeNode) {
    const enumName = typeNode.typeName.text;
    const enumTypes = metadataGenerator_1.MetadataGenerator.current.nodes
        .filter(node => node.kind === ts.SyntaxKind.EnumDeclaration)
        .filter(node => node.name.text === enumName);
    if (!enumTypes.length) {
        return;
    }
    if (enumTypes.length > 1) {
        throw new Error(`Multiple matching enum found for enum ${enumName}; please make enum names unique.`);
    }
    const enumDeclaration = enumTypes[0];
    function getEnumValue(member) {
        const initializer = member.initializer;
        if (initializer) {
            if (initializer.expression) {
                return initializer.expression.text;
            }
            return initializer.text;
        }
        return;
    }
    return {
        enumMembers: enumDeclaration.members.map((member, index) => {
            return getEnumValue(member) || index;
        }),
        typeName: 'enum',
    };
}
function getLiteralType(typeNode) {
    const literalName = typeNode.typeName.text;
    const literalTypes = metadataGenerator_1.MetadataGenerator.current.nodes
        .filter(node => node.kind === ts.SyntaxKind.TypeAliasDeclaration)
        .filter(node => {
        const innerType = node.type;
        return innerType.kind === ts.SyntaxKind.UnionType && innerType.types;
    })
        .filter(node => node.name.text === literalName);
    if (!literalTypes.length) {
        return;
    }
    if (literalTypes.length > 1) {
        throw new Error(`Multiple matching enum found for enum ${literalName}; please make enum names unique.`);
    }
    const unionTypes = literalTypes[0].type.types;
    return {
        enumMembers: unionTypes.map((unionNode) => unionNode.literal.text),
        typeName: 'enum',
    };
}
function getInlineObjectType(typeNode) {
    const type = {
        properties: getModelTypeProperties(typeNode),
        typeName: ''
    };
    return type;
}
function getReferenceType(type, genericTypeMap, genericTypes) {
    let typeName = resolveFqTypeName(type);
    if (genericTypeMap && genericTypeMap.has(typeName)) {
        const refType = genericTypeMap.get(typeName);
        type = refType.typeName;
        typeName = resolveFqTypeName(type);
    }
    const typeNameWithGenerics = getTypeName(typeName, genericTypes);
    try {
        const existingType = localReferenceTypeCache[typeNameWithGenerics];
        if (existingType) {
            return existingType;
        }
        if (inProgressTypes[typeNameWithGenerics]) {
            return createCircularDependencyResolver(typeNameWithGenerics);
        }
        inProgressTypes[typeNameWithGenerics] = true;
        const modelTypeDeclaration = getModelTypeDeclaration(type);
        const properties = getModelTypeProperties(modelTypeDeclaration, genericTypes);
        const additionalProperties = getModelTypeAdditionalProperties(modelTypeDeclaration);
        const referenceType = {
            description: getModelDescription(modelTypeDeclaration),
            properties: properties,
            typeName: typeNameWithGenerics,
        };
        if (additionalProperties && additionalProperties.length) {
            referenceType.additionalProperties = additionalProperties;
        }
        const extendedProperties = getInheritedProperties(modelTypeDeclaration, genericTypes);
        mergeReferenceTypeProperties(referenceType.properties, extendedProperties);
        localReferenceTypeCache[typeNameWithGenerics] = referenceType;
        return referenceType;
    }
    catch (err) {
        console.error(`There was a problem resolving type of '${getTypeName(typeName, genericTypes)}'.`);
        throw err;
    }
}
function mergeReferenceTypeProperties(properties, extendedProperties) {
    extendedProperties.forEach(prop => {
        const existingProp = properties.find(p => p.name === prop.name);
        if (existingProp) {
            existingProp.description = existingProp.description || prop.description;
        }
        else {
            properties.push(prop);
        }
    });
}
function resolveFqTypeName(type) {
    if (type.kind === ts.SyntaxKind.Identifier) {
        return type.text;
    }
    const qualifiedType = type;
    return resolveFqTypeName(qualifiedType.left) + '.' + qualifiedType.right.text;
}
function resolveSimpleTypeName(type) {
    if (type.kind === ts.SyntaxKind.Identifier) {
        return type.text;
    }
    const qualifiedType = type;
    return qualifiedType.right.text;
}
function getTypeName(typeName, genericTypes) {
    if (!genericTypes || !genericTypes.length) {
        return typeName;
    }
    return typeName + genericTypes.map(t => getAnyTypeName(t)).join('');
}
function getAnyTypeName(typeNode) {
    const primitiveType = syntaxKindMap[typeNode.kind];
    if (primitiveType) {
        return primitiveType;
    }
    if (typeNode.kind === ts.SyntaxKind.ArrayType) {
        const arrayType = typeNode;
        return getAnyTypeName(arrayType.elementType) + 'Array';
    }
    if ((typeNode.kind === ts.SyntaxKind.UnionType) || (typeNode.kind === ts.SyntaxKind.AnyKeyword)) {
        return 'object';
    }
    if (typeNode.kind !== ts.SyntaxKind.TypeReference) {
        throw new Error(`Unknown type: ${ts.SyntaxKind[typeNode.kind]}`);
    }
    const typeReference = typeNode;
    try {
        return typeReference.typeName.text;
    }
    catch (e) {
        console.error(e);
        return typeNode.toString();
    }
}
function createCircularDependencyResolver(typeName) {
    const referenceType = {
        description: '',
        properties: new Array(),
        typeName: typeName,
    };
    metadataGenerator_1.MetadataGenerator.current.onFinish(referenceTypes => {
        const realReferenceType = referenceTypes[typeName];
        if (!realReferenceType) {
            return;
        }
        referenceType.description = realReferenceType.description;
        referenceType.properties = realReferenceType.properties;
        referenceType.typeName = realReferenceType.typeName;
    });
    return referenceType;
}
function nodeIsUsable(node) {
    switch (node.kind) {
        case ts.SyntaxKind.InterfaceDeclaration:
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.TypeAliasDeclaration:
            return true;
        default: return false;
    }
}
function resolveLeftmostIdentifier(type) {
    while (type.kind !== ts.SyntaxKind.Identifier) {
        type = type.left;
    }
    return type;
}
function resolveModelTypeScope(leftmost, statements) {
    return statements;
}
function getModelTypeDeclaration(type) {
    const leftmostIdentifier = resolveLeftmostIdentifier(type);
    const statements = resolveModelTypeScope(leftmostIdentifier, metadataGenerator_1.MetadataGenerator.current.nodes);
    const typeName = type.kind === ts.SyntaxKind.Identifier
        ? type.text
        : type.right.text;
    const modelTypes = statements
        .filter(node => {
        if (!nodeIsUsable(node)) {
            return false;
        }
        const modelTypeDeclaration = node;
        return modelTypeDeclaration.name.text === typeName;
    });
    if (!modelTypes.length) {
        throw new Error(`No matching model found for referenced type ${typeName}`);
    }
    return modelTypes[0];
}
function getModelTypeProperties(node, genericTypes) {
    if (node.kind === ts.SyntaxKind.TypeLiteral || node.kind === ts.SyntaxKind.InterfaceDeclaration) {
        const interfaceDeclaration = node;
        return interfaceDeclaration.members
            .filter(member => {
            if (member.type && member.type.kind === ts.SyntaxKind.FunctionType) {
                return false;
            }
            return member.kind === ts.SyntaxKind.PropertySignature;
        })
            .map((member) => {
            const propertyDeclaration = member;
            const identifier = propertyDeclaration.name;
            if (!propertyDeclaration.type) {
                throw new Error('No valid type found for property declaration.');
            }
            let aType = propertyDeclaration.type;
            if (aType.kind === ts.SyntaxKind.TypeReference && genericTypes && genericTypes.length && node.typeParameters) {
                const typeParams = _.map(node.typeParameters, (typeParam) => {
                    return typeParam.name.text;
                });
                const typeIdentifier = aType.typeName;
                let typeIdentifierName;
                if (typeIdentifier.text) {
                    typeIdentifierName = typeIdentifier.text;
                }
                else {
                    typeIdentifierName = typeIdentifier.right.text;
                }
                const indexOfType = _.indexOf(typeParams, typeIdentifierName);
                if (indexOfType >= 0) {
                    aType = genericTypes[indexOfType];
                }
            }
            return {
                description: getNodeDescription(propertyDeclaration),
                name: identifier.text,
                required: !propertyDeclaration.questionToken,
                type: resolveType(aType)
            };
        });
    }
    if (node.kind === ts.SyntaxKind.TypeAliasDeclaration) {
        return getModelTypeProperties(node.type, genericTypes);
    }
    const classDeclaration = node;
    let properties = classDeclaration.members.filter((member) => {
        if (member.kind !== ts.SyntaxKind.PropertyDeclaration) {
            return false;
        }
        const propertySignature = member;
        return propertySignature && hasPublicMemberModifier(propertySignature);
    });
    const classConstructor = classDeclaration.members.find((member) => member.kind === ts.SyntaxKind.Constructor);
    if (classConstructor && classConstructor.parameters) {
        properties = properties.concat(classConstructor.parameters.filter(parameter => hasPublicConstructorModifier(parameter)));
    }
    return properties
        .map(declaration => {
        const identifier = declaration.name;
        if (!declaration.type) {
            throw new Error('No valid type found for property declaration.');
        }
        return {
            description: getNodeDescription(declaration),
            name: identifier.text,
            required: !declaration.questionToken,
            type: resolveType(resolveTypeParameter(declaration.type, classDeclaration, genericTypes))
        };
    });
}
function resolveTypeParameter(type, classDeclaration, genericTypes) {
    if (genericTypes && classDeclaration.typeParameters && classDeclaration.typeParameters.length) {
        for (let i = 0; i < classDeclaration.typeParameters.length; i++) {
            if (type.typeName && classDeclaration.typeParameters[i].name.text === type.typeName.text) {
                return genericTypes[i];
            }
        }
    }
    return type;
}
function getModelTypeAdditionalProperties(node) {
    if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
        const interfaceDeclaration = node;
        return interfaceDeclaration.members
            .filter(member => member.kind === ts.SyntaxKind.IndexSignature)
            .map((member) => {
            const indexSignatureDeclaration = member;
            const indexType = resolveType(indexSignatureDeclaration.parameters[0].type);
            if (indexType.typeName !== 'string') {
                throw new Error(`Only string indexers are supported. Found ${indexType.typeName}.`);
            }
            return {
                description: '',
                name: '',
                required: true,
                type: resolveType(indexSignatureDeclaration.type)
            };
        });
    }
    return undefined;
}
function hasPublicMemberModifier(node) {
    return !node.modifiers || node.modifiers.every(modifier => {
        return modifier.kind !== ts.SyntaxKind.ProtectedKeyword && modifier.kind !== ts.SyntaxKind.PrivateKeyword;
    });
}
function hasPublicConstructorModifier(node) {
    return node.modifiers && node.modifiers.some(modifier => {
        return modifier.kind === ts.SyntaxKind.PublicKeyword;
    });
}
function getInheritedProperties(modelTypeDeclaration, genericTypes) {
    const properties = new Array();
    if (modelTypeDeclaration.kind === ts.SyntaxKind.TypeAliasDeclaration) {
        return [];
    }
    const heritageClauses = modelTypeDeclaration.heritageClauses;
    if (!heritageClauses) {
        return properties;
    }
    heritageClauses.forEach(clause => {
        if (!clause.types) {
            return;
        }
        clause.types.forEach((t) => {
            let type = metadataGenerator_1.MetadataGenerator.current.getClassDeclaration(t.expression.getText());
            if (!type) {
                type = metadataGenerator_1.MetadataGenerator.current.getInterfaceDeclaration(t.expression.getText());
            }
            const baseEntityName = t.expression;
            const parentGenerictypes = resolveTypeArguments(modelTypeDeclaration, genericTypes);
            const genericTypeMap = resolveTypeArguments(type, t.typeArguments, parentGenerictypes);
            const subClassGenericTypes = getSubClassGenericTypes(genericTypeMap, t.typeArguments);
            getReferenceType(baseEntityName, genericTypeMap, subClassGenericTypes).properties
                .forEach(property => properties.push(property));
        });
    });
    return properties;
}
function getModelDescription(modelTypeDeclaration) {
    return getNodeDescription(modelTypeDeclaration);
}
function getNodeDescription(node) {
    const symbol = metadataGenerator_1.MetadataGenerator.current.typeChecker.getSymbolAtLocation(node.name);
    if (symbol) {
        if (node.kind === ts.SyntaxKind.Parameter) {
            symbol.flags = 0;
        }
        const comments = symbol.getDocumentationComment(metadataGenerator_1.MetadataGenerator.current.typeChecker);
        if (comments.length) {
            return ts.displayPartsToString(comments);
        }
    }
    return '';
}
function getSubClassGenericTypes(genericTypeMap, typeArguments) {
    if (genericTypeMap && typeArguments) {
        const result = [];
        typeArguments.forEach((t) => {
            const typeName = getAnyTypeName(t);
            if (genericTypeMap.has(typeName)) {
                result.push(genericTypeMap.get(typeName));
            }
            else {
                result.push(t);
            }
        });
        return result;
    }
    return null;
}
function getSuperClass(node, typeArguments) {
    const clauses = node.heritageClauses;
    if (clauses) {
        const filteredClauses = clauses.filter(clause => clause.token === ts.SyntaxKind.ExtendsKeyword);
        if (filteredClauses.length > 0) {
            const clause = filteredClauses[0];
            if (clause.types && clause.types.length) {
                const type = metadataGenerator_1.MetadataGenerator.current.getClassDeclaration(clause.types[0].expression.getText());
                return {
                    type: type,
                    typeArguments: resolveTypeArguments(type, clause.types[0].typeArguments, typeArguments)
                };
            }
        }
    }
    return undefined;
}
exports.getSuperClass = getSuperClass;
function buildGenericTypeMap(node, typeArguments) {
    const result = new Map();
    if (node.typeParameters && typeArguments) {
        node.typeParameters.forEach((typeParam, index) => {
            const paramName = typeParam.name.text;
            result.set(paramName, typeArguments[index]);
        });
    }
    return result;
}
function resolveTypeArguments(node, typeArguments, parentTypeArguments) {
    const result = buildGenericTypeMap(node, typeArguments);
    if (parentTypeArguments) {
        result.forEach((value, key) => {
            const typeName = getAnyTypeName(value);
            if (parentTypeArguments.has(typeName)) {
                result.set(key, parentTypeArguments.get(typeName));
            }
        });
    }
    return result;
}
function getCommonPrimitiveAndArrayUnionType(typeNode) {
    if (typeNode && typeNode.kind === ts.SyntaxKind.UnionType) {
        const union = typeNode;
        const types = union.types.map(t => resolveType(t));
        const arrType = types.find(t => t.typeName === 'array');
        const primitiveType = types.find(t => t.typeName !== 'array');
        if (types.length === 2 && arrType && arrType.elementType && primitiveType && arrType.elementType.typeName === primitiveType.typeName) {
            return arrType;
        }
    }
    return null;
}
exports.getCommonPrimitiveAndArrayUnionType = getCommonPrimitiveAndArrayUnionType;
function getLiteralValue(expression) {
    if (expression.kind === ts.SyntaxKind.StringLiteral) {
        return expression.text;
    }
    if (expression.kind === ts.SyntaxKind.NumericLiteral) {
        return parseFloat(expression.text);
    }
    if (expression.kind === ts.SyntaxKind.TrueKeyword) {
        return true;
    }
    if (expression.kind === ts.SyntaxKind.FalseKeyword) {
        return false;
    }
    if (expression.kind === ts.SyntaxKind.ArrayLiteralExpression) {
        return expression.elements.map(e => getLiteralValue(e));
    }
    return;
}
exports.getLiteralValue = getLiteralValue;
