# Documentation

This folder contains the documentation of the project. It is currently working in progress.

Our website is a single-page application (SPA). Our source code is intended to be modular. We have a number of directories and files that play separate roles.

-   [App.vue](/src/App.vue) : the root component
-   [components](/src/components) : all the child components
-   [algorithm](/src/algorithm) : algorithm for schedule building and rendering
-   [models](/src/models) : models and data structures used to store and manipulate data
-   [store](/src/store) : our state management module
-   [data](/src/data) : data loaders
-   [utils](/src/utils): utilities used across the whole project

<!-- <img src="components.png"
     alt="components.png"
     style="margin-left: 10%; width:80%;" /> -->

## Architecture Diagram

The following diagram gives an overview of our website's architecture.

![diagram](./Website%20Architecture.png)

## Why TypeScript

TypeScript helps us to maintain this large and complex website by providing static type information and type checking. It helps to eliminate errors at compile time rather then at run time. With TypeScript, a change in a data structure's API will cause the compiler to throw errors everywhere when it is used, which aid refactoring.

Because the aforementioned benefits (and many others), we strive to make everything in our codebase type-safe.

## State Management

A common state management library used in Vue projects is Vuex. However, because it is simply too verbose to write type-safe Vuex code, we decided to not use it. Instead, we composed the store modules by ourselves and form a Mixin that is injected in places where it is needed.

<!--
In the [store](/src/store) folder, every file except the index.ts is a store module. A store module has some properties that are repres -->

## Building the documentation

TypeScript documentation that is built from master is available to browse at https://plannable.org/docs/tsdoc/. However, I personally prefer checking out the source code in my favorite editor rather than browsing the built doc online

### Building from source

> Note: if you don't have typedoc installed, you can install it globally by `npm install -g typedoc`

You can build the documentation for typescript files by running

```bash
npm run tsdoc
```
