const dependencyKeys = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "bundledDependencies",
  "optionalDependencies",
];

const apiUrlBase = "https://registry.npmjs.org/";
const npmUrlBase = "https://www.npmjs.com/package/";

// create a set of all dependencies used by the project
const textarea = document.querySelector("#read-only-cursor-text-area");
const code_json = JSON.parse(textarea.value);
const dependencies = {};
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

// observes a div in the symbols pane (as narrow as possible) for changes
const symbolPaneContentObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      const symbolsPane = document.querySelector("#symbols-pane");
      symbolPaneContentObserver.disconnect();
      if (!symbolsPane) {
        return;
      }

      const div = symbolsPane.querySelector("div[title]");
      const name = div.innerText
        .replaceAll('"', "")
        .replace(/[^\x00-\x7F]/g, "");

      const npmDiv = symbolsPane.querySelector("#ext-symbolpane-npm");
      if (npmDiv) {
        if (name != npmDiv.getAttribute("title")) {
          updateNpmDiv(npmDiv, name);
        }
      } else {
        const npmDiv = createNpmDiv(name);
        symbolsPane.appendChild(npmDiv);
      }
    }
  }
});

const symbolsPaneExistsObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      const symbolsPane = document.querySelector("#symbols-pane");
      if (symbolsPane) {
        const div = symbolsPane.querySelector("div[title]");
        const name = div.innerText
          .replaceAll('"', "")
          .replace(/[^\x00-\x7F]/g, "");

        var npmDiv = symbolsPane.querySelector("#ext-symbolpane-npm");

        if (!dependencies[name] || dependencies[name].startsWith("git") || dependencies[name].startsWith("workspace")) {
          if (npmDiv) {
            npmDiv.remove();
          }
        } else {
          if (!npmDiv) {
            npmDiv = createNpmDiv(name);
            symbolsPane.appendChild(npmDiv);
          }
        }
        symbolPaneContentObserver.observe(div, config);
      } else {
        symbolPaneContentObserver.disconnect();
      }
    }
  }
});

const symbolsPaneTargetNode = document.querySelector(
  '[data-target="react-app.reactRoot"]'
);
const config = { attributes: true, childList: true, subtree: true };
symbolsPaneExistsObserver.observe(symbolsPaneTargetNode, config);

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
  desc_div.innerText = "Loading Description...";
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
  const npmIconUrl = chrome.runtime.getURL("images/icon-24.png");
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
  const homeIconUrl = chrome.runtime.getURL("images/home.png");
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
  const githubIconUrl = chrome.runtime.getURL("images/brand-github.png");
  githubIcon.setAttribute("src", githubIconUrl);
  githubIcon.setAttribute("alt", "github icon");
  githubIcon.setAttribute("style", "padding-left: 0.5rem;");
  githubIcon.setAttribute("style", "height: 24px; width: 24px;");
  linkGitHub.appendChild(githubIcon);
  linkGitHub.setAttribute("hidden", "true");
  link_div.appendChild(linkGitHub);

  fetchDetails(name, desc_div);

  const linkToExt = document.createElement("a");
  linkToExt.setAttribute("href", "https://github.com/chs2019");
  linkToExt.setAttribute(
    "style",
    "font-size: 10px; color=var(--fgColor-muted); text-decoration: none; padding: 8px 0;"
  );
  linkToExt.innerText = "Extension made by chs";
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

function fetchDetails(name, uiElement) {
  const fetchUrl = apiUrlBase + name;
  fetch(fetchUrl)
    .then((response) => response.json())
    .then((json) => {
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
          const githubUrl = new URL(json["repository"]["url"]);
          githubUrl.protocol = "https:";
          linkGitHub.setAttribute("href", githubUrl.href);
          linkGitHub.removeAttribute("hidden");
        } else {
          linkGitHub.setAttribute("hidden", "true");
        }
      }
    });
}
