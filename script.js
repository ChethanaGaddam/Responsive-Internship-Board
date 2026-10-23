
"use strict";

const searchInput = document.getElementById("search");
const domainFilter = document.getElementById("domain-filter");
const clearButton = document.getElementById("clear-filters");
const internshipList = document.getElementById("internship-list");
const resultsCount = document.getElementById("results-count");
const emptyState = document.getElementById("empty-state");
const errorMessage = document.getElementById("error-message");
const retryButton = document.getElementById("retry-button");

let internships = [];

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function createInternshipCard(internship) {
    const card = createElement("article", "internship-card");
    const top = createElement("div", "card-top");
    const mark = createElement("div", "company-mark", internship.initials);
    const domain = createElement("span", "domain-tag", internship.domain);

    mark.setAttribute("aria-hidden", "true");

    top.append(mark, domain);

    const title = createElement("h3", "", internship.title);
    const company = createElement("p", "company-name", internship.company);
    const description = createElement(
        "p",
        "card-description",
        internship.description
    );

    const details = createElement("div", "card-details");
    details.append(
        createElement("span", "", `📍 ${internship.location}`),
        createElement("span", "", internship.type)
    );

    const footer = createElement("div", "card-footer");
    const stipend = createElement("span", "stipend", internship.stipend);
    const applyLink = createElement("a", "apply-link", "View opportunity");

    applyLink.href = internship.applyUrl;
    applyLink.target = "_blank";
    applyLink.rel = "noopener noreferrer";
    applyLink.setAttribute(
        "aria-label",
        `View opportunity: ${internship.title} at ${internship.company}`
    );

    footer.append(stipend, applyLink);
    card.append(top, title, company, description, details, footer);

    return card;
}

function populateDomains() {
    const selectedDomain = domainFilter.value;

    const domains = [...new Set(
        internships.map((internship) => internship.domain)
    )].sort((a, b) => a.localeCompare(b));

    domainFilter.replaceChildren(
        new Option("All domains", "all")
    );

    domains.forEach((domain) => {
        domainFilter.add(new Option(domain, domain));
    });

    domainFilter.value = domains.includes(selectedDomain)
        ? selectedDomain
        : "all";
}

function renderInternships() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedDomain = domainFilter.value;

    const filteredInternships = internships.filter((internship) => {
        const searchableText = [
            internship.title,
            internship.company,
            internship.domain,
            internship.location,
            internship.description
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchTerm);
        const matchesDomain =
            selectedDomain === "all" ||
            internship.domain === selectedDomain;

        return matchesSearch && matchesDomain;
    });

    internshipList.replaceChildren();

    filteredInternships.forEach((internship) => {
        internshipList.appendChild(createInternshipCard(internship));
    });

    resultsCount.textContent =
        `${filteredInternships.length} ` +
        `${filteredInternships.length === 1 ? "internship" : "internships"} found`;

    emptyState.hidden = filteredInternships.length !== 0;
}

function showError() {
    internshipList.replaceChildren();
    internshipList.setAttribute("aria-busy", "false");
    resultsCount.textContent = "Internships unavailable";
    emptyState.hidden = true;
    errorMessage.hidden = false;
}

async function loadInternships() {
    errorMessage.hidden = true;
    emptyState.hidden = true;
    internshipList.replaceChildren();
    internshipList.setAttribute("aria-busy", "true");
    resultsCount.textContent = "Loading internships...";

    try {
        const response = await fetch("./data/internships.json");

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        const data = await response.json();

        if (
            !Array.isArray(data) ||
            !data.every((item) =>
                item &&
                Number.isInteger(item.id) &&
                typeof item.title === "string" &&
                typeof item.company === "string" &&
                typeof item.domain === "string" &&
                typeof item.description === "string" &&
                typeof item.location === "string" &&
                typeof item.type === "string" &&
                typeof item.stipend === "string" &&
                typeof item.initials === "string" &&
                typeof item.applyUrl === "string" &&
                /^https:\/\//i.test(item.applyUrl)
            )
        ) {
            throw new Error("Internship data has an invalid format.");
        }

        internships = data;
        populateDomains();
        renderInternships();
    } catch (error) {
        console.error("Unable to load internships:", error);
        internships = [];
        showError();
    } finally {
        internshipList.setAttribute("aria-busy", "false");
    }
}

searchInput.addEventListener("input", renderInternships);
domainFilter.addEventListener("change", renderInternships);

clearButton.addEventListener("click", () => {
    searchInput.value = "";
    domainFilter.value = "all";
    renderInternships();
    searchInput.focus();
});

retryButton.addEventListener("click", loadInternships);

loadInternships();
