# Easily inspect package.json dependencies

**tldr;**

This extension makes inspecting dependencies in **package.json** files on **GitHub** faster and more convenient.

## Why?

I like browsing package.json files for projects I come across, to become aware of useful packages and best practices. For package names I don't recognise it has been a bit inconvenient to copy the name and look them up on npm and/or github. 

Most often I am interested in a short **description** of the and the referenced version compares to the **latest available version**. 

## What?

The extension works when browsing a **package.json** file on **GitHub**. It appends a **Package Info** section to GitHub's symbol pane like so:

![screenshot](screenshot.png)


Dependencies added to package.json using github or workspace locators are omitted for simplicity. 

## How?

The package info section loads the dependency's description and latest published version according using the [npm registry API](https://registry.npmjs.org/), the link to the project homepage and the github repo if applicable.