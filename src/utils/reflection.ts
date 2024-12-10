/**
 * Retrieves all constructors from a given class up to a specified ancestor class in the prototype chain.
 *
 * @param targetClass The class whose constructors and ancestors you want to retrieve.
 * @param stopAtClass The ancestor class where traversal should stop (inclusive).
 * @returns An array of constructors from the target class to the stopAtClass,
 *                       ordered from the base class (stopAtClass) to the target class.
 *
 * @example
 * class E {}
 * class D extends E {}
 * class C extends D {}
 * class B extends C {}
 * class A extends B {}
 *
 * const constructors = getConstructors(A, D);
 * console.log(constructors.map((ctor) => ctor.name)); // ["C", "B", "A"]
 */
export function getConstructors(targetClass: any, stopAtClass: any): Function[] {
    const constructors: Function[] = [];

    let currentClass = targetClass;

    while (currentClass && currentClass !== stopAtClass) {
        constructors.push(currentClass);
        currentClass = Object.getPrototypeOf(currentClass);
    }

    return constructors.reverse();
}
