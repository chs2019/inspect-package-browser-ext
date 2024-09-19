# Easily inspect package.json dependencies

**tldr;**

This extension makes inspecting dependencies in **package.json** files on **GitHub** faster and more convenient.

## Why?

Saves time by displaying essential information on dependencies fast, without having to leave the page. 

## What?

The extension works when browsing a **package.json** file on **GitHub**. It appends a **Package Info** section to GitHub's symbol pane like so:

![screenshot](screenshot.png)


Dependencies added to package.json using github or workspace locators are omitted for simplicity. 

## How?

The package info section immediately displays a **link to the [npm page](https://www.npmjs.com/)** for the dependency, loads the dependency's **description** and latest **version number** using the [npm registry API](https://registry.npmjs.org/), and (if applicable) **links the project's homepage** and the **GitHub repo**.

### Technical

I am piggybacking on GitHub's symbol pane (a DOM node with id `symbols-pane`).

Two **`MutationObserver`** objects are tracking DOM mutations. One (monitoring the `body` node) checks whether `symbols-pane` is in the DOM tree. While it is, a second observer monitors changes to the symbols displayed in the symbols pane. The first observer fires often. It has a very general target node and  gets almost all DOM mutations. The second observer's target node is very specific.  

If the symbol lexically matches with a dependency, and the dependency is not something local (workspace, git), information is collected and a **`div` appended to the symbols pane**.

Since fetch from the npm API directly out of the content script is not browser indepenent, a **ServiceWorker / background script** is used.

### Discarded ideas

- making the link in the source code itself interactive (eg. hover/click) interfered with the original GitHub functionality. However I learned how `<textarea>` elements and other `<div>`s are stacked (some visible, some not) to create an editor-like experience.
- appending links at the end of the line didn't look good
- activating the extension on `package.json` urls _only_ didn't work because the GitHub site is a single-page application and the extension has not properly been triggered, hence all of GitHub matches
- accessing the npm registry API directly from the content script did work with Chrome but not with Firefox because of content security policy. That's why the service worker/background script.
- Sightly annoying: despite both Firefox and Chrome use v3 manifests, the schemes for the `background` key are not compatible.

## To Do

- package extension for publishing
- UX: use svg instead of png for gihub and home icon and test with dark mode
- DX: watch for file changes in src and build automaticalls. Also need to do a little bit of reading on proper dev workflows. 

## Disclaimer

My objective was to learn about developing browser extensions and at the same time produce something useful. Please keep this in mind should you be using this extension. If you do, I'd love to get some feedback.