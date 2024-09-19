const dependencyKeys = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "bundledDependencies",
  "optionalDependencies",
];

const apiUrlBase = "https://registry.npmjs.org/";
const npmUrlBase = "https://www.npmjs.com/package/";

const dependencies = {};

/*
GitHub has already a symbol browsing feature. We piggy back and add another div to the symbol pane
*/
let symbolsPaneSaved = null;

/*
 * Two observers are core
 */

/* 
second observer:
once a symbol pane has been opened, this observer watches out for changes in the symbols pane, 
for example the user clicking on another symbol without closing the symbol pane
*/
const symbolPaneContentObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      if (!symbolsPaneSaved) {
        throw new Error(
          "symbolPaneContentObserver: nosymbolsPaneSaved - should not happen"
        );
      }

      symbolPaneContentObserver.disconnect();

      const name = getSymbolName(symbolsPaneSaved);

      const npmDiv = symbolsPaneSaved.querySelector("#ext-symbolpane-npm");
      if (npmDiv && npmDiv.getAttribute("title") == name) {
        // nothing has changed, nothing to do
        return;
      }

      symbolPaneContentObserver.disconnect();
      if (
        dependencies[name] &&
        !dependencies[name].startsWith("git") &&
        !dependencies[name].startsWith("workspace")
      ) {
        if (npmDiv) {
          updateNpmDiv(npmDiv, name);
        } else {
          const npmDiv = createNpmDiv(name);
          symbolsPaneSaved.appendChild(npmDiv);
        }
      } else {
        if (npmDiv) {
          symbolsPaneSaved.removeChild(npmDiv);
        }
      }
      const div = symbolsPaneSaved.querySelector("div[title]");
      symbolPaneContentObserver.observe(div, config);
    }
  }
});

/* 
first observer: 
we want to piggyback on the DOM node #symbols-pane. 
thereforee, after each DOM mutation we check as quick a possible if the symbol pane node has 
appeared or disappeared
*/
const symbolsPaneExistsObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type == "childList") {
      const symbolsPane = document.querySelector("#symbols-pane");

      if (symbolsPane) {
        if (!symbolsPaneSaved) {
          // change from invisible to visible
          // console.log("symbols pane changed to VISIBLE", mutation);
          symbolsPaneSaved = symbolsPane;

          // check whether we are looking at a file taht interests us
          if (document.baseURI.endsWith("package.json")) {
            // always read deps when symbol pane becomes visible as we might have stale data
            readDependencies();

            // get the symbol name
            const name = getSymbolName(symbolsPaneSaved);

            // check if name may refer to a dependency and has an npm version
            if (
              dependencies[name] &&
              !dependencies[name].startsWith("git") &&
              !dependencies[name].startsWith("workspace")
            ) {
              if (symbolsPane.querySelector("#ext-symbolpane-npm")) {
                throw new Error("didnt expect #ext-symbolpane-npm here");
              }
              // display our extension div
              const npmDiv = createNpmDiv(name);
              symbolsPane.appendChild(npmDiv);
            }
            // start observing mutations of the symbol pane content, to be able to update our content when necessary
            // select a target as specific as possible to avoid unnecessary observer hits
            const div = symbolsPane.querySelector("div[title]");
            symbolPaneContentObserver.observe(div, config);
          }
        }
      } else {
        if (symbolsPaneSaved) {
          // change from visible to invisible
          // console.log("symbols pane DISAPPEARED", mutation);
          symbolsPaneSaved = null;

          // disconnect content observer
          symbolPaneContentObserver.disconnect();
        }
      }
    }
  }
});

const config = { attributes: true, childList: true, subtree: true };
symbolsPaneExistsObserver.observe(document.querySelector("body"), config);

/*
 * Helpers
 */

/*
collect all depemdencies from a package.json file. used to compare symbol names against. 
if the symbol name is 
*/
function readDependencies() {
  const textarea = document.querySelector("#read-only-cursor-text-area");
  if (!textarea) {
    //console.error("no textarea yet, will try again later");
    return;
  }

  const code_json = JSON.parse(textarea.value);

  dependencyKeys.forEach((key) => {
    if (code_json[key]) {
      Object.entries(code_json[key]).forEach((item) => {
        const [name, version] = item;
        if (version.startsWith("git") || version.startsWith("workspace")) {
          return;
        }
        dependencies[name] = version;
      });
    }
  });
}

function getSymbolName(symbolsPane) {
  const div = symbolsPane.querySelector("div[title]");
  const name = div.innerText.replaceAll('"', "").replace(/[^\x00-\x7F]/g, "");
  return name;
}

function createNpmDiv(name) {
  const div = document.createElement("div");
  div.setAttribute("id", "ext-symbolpane-npm");
  div.setAttribute("name", name);
  div.setAttribute(
    "style",
    "padding: 8px 16px; border-top: 1px solid var(--borderColor-muted)"
  );

  h3 = document.createElement("h3");
  h3.innerText = "Package Info";
  h3.setAttribute("style", "font-size: 14px;");
  div.appendChild(h3);

  const desc_div = document.createElement("div");
  desc_div.setAttribute("id", "ext-symbolpane-npm-description");
  desc_div.setAttribute("style", "font-size: 12px; padding: 8px 0;");
  desc_div.innerText = "Loading description...";
  div.appendChild(desc_div);

  const versionDiv = document.createElement("div");
  versionDiv.setAttribute("id", "ext-symbolpane-npm-version");
  versionDiv.setAttribute("style", "font-size: 12px; padding: 8px 0;");
  versionDiv.setAttribute("hidden", "true");
  div.appendChild(versionDiv);

  const link_div = document.createElement("div");
  link_div.setAttribute("id", "ext-symbolpane-npm-links");
  link_div.setAttribute(
    "style",
    "display: flex; gap: 1rem; justify-content: end;"
  );
  div.appendChild(link_div);

  const linkNpm = document.createElement("a");
  const urlNpm = `${npmUrlBase}${name}`;
  linkNpm.setAttribute("href", urlNpm);
  linkNpm.setAttribute("id", "ext-symbolpane-npm-link-npm");
  linkNpm.setAttribute("target", "_blank");

  const npmIcon = document.createElement("img");
  const npmIconUrl = chrome.runtime.getURL("images/n-icon-24.png");
  npmIcon.setAttribute("src", npmIconUrl);
  npmIcon.setAttribute("alt", "The npm icon");
  linkNpm.appendChild(npmIcon);
  link_div.appendChild(linkNpm);

  const linkHome = document.createElement("a");
  const urlHome = "#";
  linkHome.setAttribute("href", urlHome);
  linkHome.setAttribute("id", "ext-symbolpane-npm-link-home");
  linkHome.setAttribute("target", "_blank");

  const homeIcon = document.createElement("img");
  const homeIconUrl = chrome.runtime.getURL("images/home-bg.png");
  homeIcon.setAttribute("src", homeIconUrl);
  homeIcon.setAttribute("alt", "Home icon");
  homeIcon.setAttribute("style", "padding-left: 0.5rem;");
  homeIcon.setAttribute("style", "height: 24px; width: 24px;");
  linkHome.appendChild(homeIcon);
  linkHome.setAttribute("hidden", "true");
  link_div.appendChild(linkHome);

  const linkGitHub = document.createElement("a");
  const urlGitHub = "#";
  linkGitHub.setAttribute("href", urlGitHub);
  linkGitHub.setAttribute("id", "ext-symbolpane-npm-link-github");
  linkGitHub.setAttribute("target", "_blank");
  const githubIcon = document.createElement("img");
  const githubIconUrl = chrome.runtime.getURL("images/brand-github-bg.png");
  githubIcon.setAttribute("src", githubIconUrl);
  githubIcon.setAttribute("alt", "github icon");
  githubIcon.setAttribute("style", "padding-left: 0.5rem;");
  githubIcon.setAttribute("style", "height: 24px; width: 24px;");
  linkGitHub.appendChild(githubIcon);
  linkGitHub.setAttribute("hidden", "true");
  link_div.appendChild(linkGitHub);

  fetchDetails(name, desc_div);

  const linkToExt = document.createElement("a");
  linkToExt.setAttribute(
    "href",
    "https://github.com/chs2019/inspect-package-browser-ext"
  );
  linkToExt.setAttribute(
    "style",
    "font-size: 10px; color=var(--fgColor-muted); text-decoration: none; padding: 8px 0;"
  );
  linkToExt.innerText = `An extension made with ❤️ by chs2019`;
  div.appendChild(linkToExt);

  return div;
}

function updateNpmDiv(div, name) {
  div.setAttribute("name", name);
  const urlNpm = `${npmUrlBase}${name}`;
  const linkNpm = div.querySelector("#ext-symbolpane-npm-link-npm");
  linkNpm.setAttribute("href", urlNpm);
  desc_div = document.querySelector("#ext-symbolpane-npm-description");
  desc_div.innerText = "Loading Description...";

  const linkHome = document.querySelector("#ext-symbolpane-npm-link-home");
  if (linkHome) {
    linkHome.setAttribute("hidden", "true");
  }

  const linkGithub = document.querySelector("#ext-symbolpane-npm-link-github");
  if (linkGithub) {
    linkGithub.setAttribute("hidden", "true");
  }

  const versionDiv = document.querySelector("#ext-symbolpane-npm-version");
  if (versionDiv) {
    versionDiv.setAttribute("hidden", "true");
  }

  fetchDetails(name, desc_div);
}

/*
because of content origin policy we cannot contact the npm api server directly from the content
script. Therefore we need to let a service worker do this task

TODO: separate fetching from displaying the data (do one thing only)
*/
function fetchDetails(name, uiElement) {
  const fetchUrl = apiUrlBase + name;

  chrome.runtime.sendMessage(
    { type: "package_info", url: fetchUrl },
    (json) => {
      if (!json) {
        console.error(
          "Did not get json data from background / service worker."
        );
        return;
      }

      if (json["description"]) {
        uiElement.innerText = json["description"];
      } else {
        uiElement.innerText = "No description available.";
      }

      if (json["dist-tags"] && json["dist-tags"]["latest"]) {
        const latestVersion = json["dist-tags"]["latest"];
        const versionDiv = document.querySelector(
          "#ext-symbolpane-npm-version"
        );
        if (versionDiv) {
          versionDiv.innerText = "Latest version: " + latestVersion;
          versionDiv.removeAttribute("hidden");
        }
      }

      const linkHome = document.querySelector("#ext-symbolpane-npm-link-home");
      if (linkHome) {
        if (json["homepage"]) {
          linkHome.setAttribute("href", json["homepage"]);
          linkHome.removeAttribute("hidden");
        } else {
          linkHome.setAttribute("hidden", "true");
        }
      }

      const linkGitHub = document.querySelector(
        "#ext-symbolpane-npm-link-github"
      );
      if (linkGitHub) {
        if (
          json["repository"] &&
          json["repository"]["url"].includes("github")
        ) {
          const repoUrl = new URL(json["repository"]["url"]);
          const githubUrl = new URL("https:" + repoUrl.pathname);
          linkGitHub.setAttribute("href", githubUrl.href);
          linkGitHub.removeAttribute("hidden");
        } else {
          linkGitHub.setAttribute("hidden", "true");
        }
      }
    }
  );
}
