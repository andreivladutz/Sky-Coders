import Dialog from "./bootstrapObjects/Dialog";
import CST from "../../CST";
import GameManager from "../../online/GameManager";

const LB = CST.LEADERBOARD;

export default class Leaderboard {
  private static instance = null;

  private dialog: Dialog;
  private paginationNav: HTMLElement;
  private pagesList: HTMLUListElement;

  private constructor() {
    this.dialog = Dialog.getInstance();

    this.generatePaginationNav();
  }
  // TODO: add listeners to LIs to change page
  // TODO: generate the users table and add page switching logic
  public async show() {
    let leaderboardCfg = await GameManager.getInstance().messengers.users.getLeaderboardInit();

    this.regeneratePaginationList(1, leaderboardCfg.pagesCount);
    this.dialog.show("Leaderboard", this.paginationNav.outerHTML);
  }

  // On showing, regenerate the pagination list
  private regeneratePaginationList(currPage: number, pageCount: number) {
    this.pagesList.innerHTML = "";

    this.createPrevListItem(currPage === 1);

    for (let i = 1; i <= pageCount; i++) {
      let anchor = this.createPageListItem(i === currPage);
      anchor.innerText = i.toString();
    }

    this.createNextListItem(currPage === pageCount);
  }

  private generatePaginationNav() {
    this.paginationNav = document.createElement("nav");
    this.paginationNav.setAttribute("aria-label", LB.PAGE_NAV.ARIA_LABEL);

    this.pagesList = document.createElement("ul");
    LB.UL.CLASSES.forEach(className => this.pagesList.classList.add(className));
    this.paginationNav.appendChild(this.pagesList);
  }

  // Prev page button
  private createPrevListItem(disabled = false) {
    let prevA = this.createPageListItem(false, disabled);

    prevA.innerHTML = LB.UL.LI.ANCHOR.PREV.INNER_HTML;
    prevA.setAttribute("aria-label", LB.UL.LI.ANCHOR.PREV.ARIA_LABEL);
  }

  // Next page button
  private createNextListItem(disabled = false) {
    let nextA = this.createPageListItem(false, disabled);

    nextA.innerHTML = LB.UL.LI.ANCHOR.NEXT.INNER_HTML;
    nextA.setAttribute("aria-label", LB.UL.LI.ANCHOR.NEXT.ARIA_LABEL);
  }

  // Create and append an LI for the pagination and return the inner anchor element
  // Active should be true if this is current page
  // Disabled should be true for disabled pages
  private createPageListItem(
    active = false,
    disabled = false
  ): HTMLAnchorElement {
    let li = document.createElement("li");
    let anchor = document.createElement("a");

    li.classList.add(LB.UL.LI.CLASS);
    anchor.classList.add(LB.UL.LI.ANCHOR.CLASS);
    anchor.setAttribute("href", LB.UL.LI.ANCHOR.HREF);
    li.appendChild(anchor);

    if (active) {
      li.classList.add(LB.UL.LI.ACTIVE);
    }

    if (disabled) {
      li.classList.add(LB.UL.LI.DISABLED);
    }

    this.pagesList.appendChild(li);
    return anchor;
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new Leaderboard();
    }

    return this.instance;
  }
}
