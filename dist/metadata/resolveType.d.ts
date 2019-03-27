import * as ts from 'typescript';
import { Type } from './metadataGenerator';
export declare function resolveType(
  typeNode?: ts.TypeNode,
  genericTypeMap?: Map<String, ts.TypeNode>
): Type;
export declare function getSuperClass(
  node: ts.ClassDeclaration,
  typeArguments?: Map<String, ts.TypeNode>
): {
  type: any;
  typeArguments: Map<String, ts.TypeNode>;
};
export declare function getCommonPrimitiveAndArrayUnionType(
  typeNode?: ts.TypeNode
): Type | null;
export declare function getLiteralValue(expression: ts.Expression): any;
