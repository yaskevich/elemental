import { StyleValue } from 'vue';
import type { UploadInst, UploadFileInfo, MessageType } from 'naive-ui';

declare global {
  interface keyable {
    [key: string]: any;
  }

  interface ISchemeItem {
    type: string;
    id: string;
    title: string;
  }

  interface IText {
    id: number;
    author: string;
    title: string;
    meta: string;
    url: string;
    grammar: boolean;
    comments: boolean;
    loaded: boolean;
    published: string;
    date: string;
    credits: string;
    site: string;
    zipsize: number;
    lang: string;
    langLabel: string;
    scheme: Array<ISchemeItem>;
    siteclass: string;
    creditsclass: string;
    colormark: string;
    colorselect: string;
  }
  interface ISettings {
    registration_open: boolean;
  }

  interface IUser {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    sex: number;
    server: string;
    commit: string;
    unix: number;
    privs: number;
    activated: boolean;
    requested: Date;
    text_id: number;
    zone: string;
    text?: IText;
    classes: Array<IAnnotationClass>;
  }

  interface IState {
    token?: string;
    error?: string;
    user?: IUser;
  }

  interface IBibPerson {
    given: string;
    family: string;
  }

  interface IBibTex {
    id: string;
    type: string;
    page?: string;
    title: string;
    'citation-key': string;
    author: Array<IBibPerson>;
    issued: { 'date-parts': Array<Array<number>> };
  }

  interface IBib {
    id: number;
    lang: string;
    citekey: string;
    bibtex: IBibTex;
  }

  interface IOption {
    value: number;
    label: string;
  }

  interface IRailStyle {
    focused: boolean;
    checked: boolean;
  }

  interface CategoryRecord {
    color?: string;
    font?: string;
  }

  interface ICategoriesScheme {
    [key: string]: CategoryRecord;
  }

  interface IToken {
    id: number;
    checked?: boolean;
    form: string;
    repr: string;
    meta: string;
    p: number;
    s: number;
    pos?: string;
    comments: Array<number>;
    fmt: Array<string>;
  }

  interface IComment {
    title: string;
    text_id: number;
    id: number;
    issues: Array<[number, number]>;
    tags: Array<number>;
    priority: number;
    published: boolean;
    entry: any;
  }

  interface IFullComment {
    title: string;
    text_id: number;
    id: number;
    issues: Array<[number, number]>;
    tags: Array<number>;
    priority: number;
    published: boolean;
    entry: any;
  }

  interface IImageItem {
    id: string;
    user_id: number;
    text_id: number;
    filesize: number;
    created: Date;
    title: string;
    meta: string;
    status: string;
    loaded: boolean;
    url: string;
    name: string;
  }

  interface IRow {
    bound: boolean;
    id: number;
    issues: Array<Array<number>>;
    tags: Array<number>;
    priority: number;
    published: null | boolean;
    title: string;
  }

  interface IBackup {
    filename: string;
    state: boolean;
    marked: boolean;
  }

  interface IIssue {
    id?: number;
    title: string;
    color: string;
  }

  interface ITag {
    id?: number;
    title: string;
  }

  interface IAnnotationClass {
    id: number;
    name: string;
    css: keyable; // StyleValue from vue did not work out
  }

  interface CustomFileInfo extends UploadFileInfo {
    title: string;
  }

  interface IChange {
    id?: number;
    user_id: number;
    table_name: string;
    data0: IComment;
    data1: IComment;
    created: string;
    record_id: number;
    present: boolean;
  }

  interface ICommentChange {
    id?: number;
    user_id: number;
    ut?: number;
    init: boolean;
  }
}
