# Documentation

This folder contains the documentation of the project. It is currently working in progress.

Our website is a single-page application (SPA). Our source code is intended to be modular. We have a number of directories and files that play separate roles.

-   [App.vue](/src/App.vue) : the root component
-   [components](/src/components) : all components
-   [algorithm](/src/algorithm) : algorithm for schedule building and rendering
-   [models](/src/models) : models and data structures used to store and manipulate data
-   [store](/src/store) : the state management module
-   [data](/src/data) : data loaders
-   [utils](/src/utils): utilities used across the whole project

<!-- <img src="components.png"
     alt="components.png"
     style="margin-left: 10%; width:80%;" /> -->

## TypeDoc

TypeDoc is a JSDoc-like documentation built from source code. Our TypeDoc that is built from master is available to browse at https://plannable.org/docs/tsdoc/. However, I personally prefer checking out the source code in my favorite editor rather than browsing the built doc online

### Building from source

You can build the documentation for typescript files by running

```bash
npm run tsdoc
```

It will be available in docs/tsdoc when the above command finish.

## Architecture Diagram

The following diagram gives an overview of our website's architecture.

![diagram](./Website%20Architecture.png)

## Why TypeScript

TypeScript helps us to maintain this large and complex website by providing static type information and type checking. It helps to eliminate errors at compile time rather then at run time. With TypeScript, a change in a data structure's API will cause the compiler to throw errors everywhere when it is used, which aids refactoring.

Because the aforementioned benefits (and many others), we strive to make everything in our codebase type-safe.

## View Layer

The view layer mainly consists of Vue components and the state management modules. We separate the TypeScript part from each Vue component and use a file of the same name as the component to store them. The justification for this separation is that the TypeScript language service can know which modules are used by these components. For example, if we use "Find All References" of a class exported by one of our model files, we are able to know this class is used in which component. This is particularly useful if we want to change some of our models' APIs.

Some components are pure and some are not. Pure components refer to those whose states only depend on the props passed into them. Non-pure components, on the other hand, depend on the global Store module, which means they usually `extends Store`.

## State Management

A common state management library used in Vue projects is Vuex. However, because it is simply too verbose to write type-safe Vuex code, we decided to not use it. Instead, we composed the store modules by ourselves and form a Mixin that is injected in places where it is needed.

Our Store class is declared as a Vue component so it can use Watch and other useful methods provided by Vue observation system. In this class, `filter`, `display`, etc. are references to the **instances** of the sub-module classes. The Store class keeps a list of **references** to the sub-module instances so that when they are mixed into other components, they refer to the same instance. Any mutation of the properties contained in these shared instances can be observed by Vue and trigger re-render in whatever places they are used.

```typescript
@Component
class Store extends Vue {
    filter = filter;
    display = display;
    status = status;
    modal = modal;
    schedule = schedule;
    semester = semester;
    palette = palette;
    noti = noti;

    ...
}
```

### Global Variables

We use a number of global variables to share large and non-reactive data, because for those large objects, the reactive observers may slow down execution significantly. More specifically, we have the following variables declared and assigned on the `window` object.

-   catalog
-   scheduleEvaluator
-   timeMatrix
-   buildingList

The `catalog` variable is an instance of the `Catalog` class and is used to store the course data of the current semester. `scheduleEvaluator` is an instance of the `ScheduleEvaluator` class that is used to store the generated schedules. Both instances have instance properties that contain more than a thousand keys/values. The other two variables store the data needed by the `Walking Distance` sort option.

## Model and Algorithm

Although used everywhere, the model and algorithm layer is meant to be separated from the view layer. The view layer uses models and algorithms by instantiating objects defined by model/algorithm and pass any required parameters into the constructors/methods/functions of the models or algorithms used. It is forbidden to import components/classes directly into the view layer, because circular dependency issues may arise.

## Do you know?

-   **Nested** ternary operators (`? : ? :`) are usually written by Kaiying Shan
-   **Chained** functional statements (`.map(...).filter(...)`) are usually written by Hanzhi Zhou
-   **Strange variable names** usually credit to Zichao Hu, whose GitHub username (OAHC2022) is peculiar
