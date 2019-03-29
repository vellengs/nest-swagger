'use strict';

/**
 * A decorator to document the responses that a given service method can return. It is used to generate
 * documentation for the REST service.
 * ```typescript
 * interface MyError {
 *    message: string
 * }
 * @Controller('people')
 * class PeopleService {
 *   @Response<string>(200, 'Retrieve a list of people.')
 *   @Response<MyError>(401, 'The user is unauthorized.', {message: 'The user is not authorized to access this operation.'})
 *   @Get()
 *   getPeople(@Query('name') name: string) {
 *      // ...
 *   }
 * }
 * ```
 * A Default response is created in swagger documentation from the method return analysis. So any response declared
 * through this decorator is an additional response created.
 * @param status The response status code
 * @param description A description for this response
 * @param example An optional example of response to be added to method documentation.
 */
export function Response<T>(
  name: string | number,
  description?: string,
  example?: T
): any {
  return () => {
    return;
  };
}

/**
 * Used to provide an example of method return to be added into the method response section of the
 * generated documentation for this method.
 * ```typescript
 * @Controller('people')
 * class PeopleService {
 *   @Example<Array<Person>>([{
 *     name: 'Joe'
 *   }])
 *   @Get()
 *   getPeople(@Query('name') name: string): Person[] {
 *      // ...
 *   }
 * }
 * ```
 * @param example The example returned object
 */
export function Example<T>(example: T): any {
  return () => {
    return;
  };
}

/**
 * Add tags for a given method on generated swagger documentation.
 * ```typescript
 * @Controller('people')
 * class PeopleService {
 *   @Tags('administrative', 'department1')
 *   @Get()
 *   getPeople(@Query('name') name: string) {
 *      // ...
 *   }
 * }
 * ```
 * @param values a list of tags
 */
export function Tags(...values: string[]): any {
  return () => {
    return;
  };
}

/**
 * Add a security constraint to method generated docs.
 * @param {name} security name from securityDefinitions
 * @param {scopes} security scopes from securityDefinitions
 */
export function Security(name: string, scopes?: string[]): any {
  return () => {
    return;
  };
}

/**
 * Document the method or class produces property in generated swagger docs
 */
export function Produces(...values: string[]): any {
  return () => {
    return;
  };
}

/**
 * Document the type of a property or parameter as `integer ($int32)` in generated swagger docs
 */
export function IsInt(
  target: any,
  propertyKey: string,
  parameterIndex?: number
) {
  return;
}

/**
 * Document the type of a property or parameter as `integer ($int64)` in generated swagger docs
 */
export function IsLong(
  target: any,
  propertyKey: string,
  parameterIndex?: number
) {
  return;
}

/**
 * Document the type of a property or parameter as `number ($float)` in generated swagger docs
 */
export function IsFloat(
  target: any,
  propertyKey: string,
  parameterIndex?: number
) {
  return;
}

/**
 * Document the type of a property or parameter as `number ($double)` in generated swagger docs.
 * This is the default for `number` types without a specifying decorator.
 */
export function IsDouble(
  target: any,
  propertyKey: string,
  parameterIndex?: number
) {
  return;
}
