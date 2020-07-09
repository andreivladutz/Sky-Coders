import Dialog from "./bootstrapObjects/Dialog";
import CST from "../../CST";
import GameManager from "../../online/GameManager";
import { Users } from "../../../../common/MessageTypes";
import CommonCST from "../../../../common/CommonCST";

const LB = CST.LEADERBOARD;

// TODO: Pagination does not keep count of maximum pages
// i.e. if there are too many pages, the content will overflow the modal body
export default class Leaderboard {
  private static instance = null;

  private dialog: Dialog;
  private currentPage: number;

  private paginationNav: HTMLElement;
  private pagesList: HTMLUListElement;

  private usersTable: HTMLTableElement;
  private tableBody: HTMLTableSectionElement;

  private constructor() {
    this.dialog = Dialog.getInstance();

    this.generatePaginationNav();
    this.generateTableElements();
  }

  public async show() {
    await this.changeLbPage(1);

    // Show the dialog holding the leaderboard
    this.dialog.show("Leaderboard");

    this.dialog.contentElement.appendChild(this.usersTable);
    this.dialog.contentElement.appendChild(this.paginationNav);
  }

  // Change the page of the leaderboard
  private async changeLbPage(newPage: number) {
    if (this.currentPage === newPage || newPage < 1) {
      return;
    }

    let leaderboardCfg = await GameManager.getInstance().messengers.users.getLeaderboardPage(
      newPage
    );

    if (newPage > leaderboardCfg.pagesCount) {
      newPage = leaderboardCfg.pagesCount;
    }

    this.currentPage = newPage;

    // Regenerate the page and the pagination
    this.regenerateUsersTable(leaderboardCfg.page, newPage);
    this.regeneratePaginationList(this.currentPage, leaderboardCfg.pagesCount);
  }

  // Generate the table holding the users details for this table
  private regenerateUsersTable(
    tableRows: Users.LeaderboardPage,
    currPage: number
  ) {
    this.usersTable.innerHTML = LB.TABLE.INNER_HTML;
    this.tableBody.innerHTML = "";

    tableRows.forEach((tableEntry, idx) => {
      this.addTableRow(
        idx + (currPage - 1) * CommonCST.USERS_QUERY.LEADERBOARD_LIMIT + 1,
        tableEntry
      );
    });

    this.usersTable.appendChild(this.tableBody);
  }

  private addTableRow(entryNo: number, tableEntry: Users.LeaderboardEntry) {
    let trElement = document.createElement("tr");
    let thElement = document.createElement("th");

    trElement.appendChild(thElement);
    thElement.outerHTML = LB.TABLE.BODY.GET_ROW_HEAD(entryNo);

    [
      tableEntry.name,
      tableEntry.islandCount,
      tableEntry.buildingsCount,
      tableEntry.charasCount
    ].forEach(value => {
      let td = document.createElement("td");
      td.innerText = value.toString();

      trElement.appendChild(td);
    });

    this.tableBody.appendChild(trElement);
  }

  // On showing, regenerate the pagination list
  private regeneratePaginationList(currPage: number, pageCount: number) {
    this.pagesList.innerHTML = "";

    this.createPrevListItem(currPage === 1);

    for (let i = 1; i <= pageCount; i++) {
      let anchor = this.createPageListItem(i === currPage);
      anchor.innerText = i.toString();

      anchor.onclick = () => {
        this.changeLbPage(i);
      };
    }

    this.createNextListItem(currPage === pageCount);
  }

  private generateTableElements() {
    this.usersTable = document.createElement("table");
    this.usersTable.classList.add(...LB.TABLE.TABLE_CLASSES);
    this.tableBody = document.createElement("tbody");
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

    prevA.onclick = () => {
      this.changeLbPage(this.currentPage - 1);
    };
  }

  // Next page button
  private createNextListItem(disabled = false) {
    let nextA = this.createPageListItem(false, disabled);

    nextA.innerHTML = LB.UL.LI.ANCHOR.NEXT.INNER_HTML;
    nextA.setAttribute("aria-label", LB.UL.LI.ANCHOR.NEXT.ARIA_LABEL);

    nextA.onclick = () => {
      this.changeLbPage(this.currentPage + 1);
    };
  }

  // Create and append an LI for the pagination and return the inner anchor element
  // Active should be true if this is the current page
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
