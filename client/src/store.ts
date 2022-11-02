import { reactive, ref } from 'vue';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import project from '../package.json';
import router from './router';

import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import History from '@tiptap/extension-history';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import Image from '@tiptap/extension-image';
import Dropcursor from '@tiptap/extension-dropcursor';
import CharacterCount from '@tiptap/extension-character-count';
import Gapcursor from '@tiptap/extension-gapcursor';
import Citation from './extensions/citation';
import Figure from '@yaskevich/extension-figure';
import Marker from '@yaskevich/extension-marker';
import { generateHTML } from '@tiptap/core';
import { messageDark } from 'naive-ui';

const getExtensions = (sources: Array<IBib>) => [
  Document,
  Paragraph,
  Text,
  History,
  Color,
  Placeholder.configure({
    placeholder: 'Start writing your comment...',
  }),
  Marker.configure({
    classes: state.user?.classes.map(x => x.name),
    // it seems there are no more non-set hotkeys for a browsers
    shortcuts: ['q', 'i', 'y', 'm', 'l'].map(x => 'Mod-' + x),
    tag: 'var',
  }),
  Blockquote.extend({
    content: 'paragraph*',
  }).configure({
    HTMLAttributes: {
      class: 'quote',
    },
  }),
  Bold.configure({
    HTMLAttributes: {
      class: 'em',
    },
  }),
  Image,
  Dropcursor,
  CharacterCount.configure(),
  Citation.configure({
    sources,
  }),
  Figure,
  Gapcursor,
];

const convertJSONtoHTML = (json: Object, sources: Array<IBib>) => {
  return json ? generateHTML(json, getExtensions(sources)) : '';
};

const state = reactive<IState>({
  token: localStorage.getItem('token') || '',
  user: {} as IUser,
  error: '',
});

let browserTab: Window;

const styleTagRef = ref<HTMLStyleElement>();

const setCustomCSS = () => {
  const css = state?.user?.classes
    .map(x => `var.${x.name}, button.${x.name} ${JSON.stringify(x.css).replaceAll('"', '').replaceAll(',', ';')}`)
    .join('\n');
  // console.log("CSS", css);

  // const styleTag = document.createElement('link');
  //      styleTag.type = "text/css";
  //       styleTag.href = '/api/user.css';
  //      document.head.appendChild(styleTag);
  if (styleTagRef.value) {
    // console.log("replace CSS");
    document.head.removeChild(styleTagRef.value);
  }
  if (css) {
    styleTagRef.value = document.createElement('style');
    styleTagRef.value.appendChild(document.createTextNode(css));
    document.head.appendChild(styleTagRef.value);
  }
};

const getFile = async (route: string, id: string): Promise<any> => {
  if (state.token && id) {
    try {
      const config = {
        headers: { Authorization: 'Bearer ' + state.token },
        responseType: 'blob',
        params: { id: id },
      } as AxiosRequestConfig;

      const response = await axios.get('/api/' + route, config);
      const blob = new Blob([response.data], { type: 'application/gzip' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = id;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      return error;
    }
  }
};

const logoutUser = () => {
  state.token = '';
  state.user = {} as IUser;
  localStorage.removeItem('token');
  router.replace('/login');
};

const get = async (route: string, id: string = '', data: Object = {}): Promise<any> => {
  if (state.token) {
    try {
      // console.log("data", data);
      // console.log("token", state.token);
      const config = state.token ? { headers: { Authorization: 'Bearer ' + state.token }, params: {} } : {};

      let params = id ? { id } : {};
      config.params = { ...params, ...data };

      const response = await axios.get('/api/' + route, config);
      // console.log(response.data);

      return response.data;
    } catch (error: any | AxiosError) {
      console.log('Cannot get', error);
      if (axios.isAxiosError(error)) {
        // console.log("axios error");
        if (error.response?.status === 401) {
          console.log('access denied!');
          logoutUser();
        }
      }
      return error;
    }
  }
  console.log('No key. Fail.');
};

const post = async (table: string, data: Object): Promise<any> => {
  if (state.token) {
    try {
      const config = { headers: { Authorization: 'Bearer ' + state.token } };
      // const config = {};
      // console.log(`POST ${table}`);
      const response = await axios.post('/api/' + table, data, config);
      // console.log("store:response", response.data);
      return response;
    } catch (error) {
      console.log('Cannot get', error);
      return error;
    }
  }
  console.log('No token. Fail.');
};

const postUnauthorized = async (table: string, data: Object): Promise<any> => {
  try {
    // console.log(`POST ${table}`);
    const response = await axios.post('/api/' + table, data);
    console.log('post [NO AUTH]', table, response.data);
    return response;
  } catch (error) {
    console.log('Cannot get', error);
    return error;
  }
};

const getUnauthorized = async (table: string, data?: Object): Promise<any> => {
  try {
    const response = await axios.get('/api/' + table, data);
    console.log('get [NO AUTH]', table, response.data);
    return response;
  } catch (error) {
    console.log('Cannot get', error);
    return error;
  }
};

const getUser = async () => {
  if (state.token) {
    try {
      ``;
      // console.log("token", state.token);
      const config = { headers: { Authorization: 'Bearer ' + state.token } };
      const response = await axios.get('/api/user/info', config);
      state.user = response.data;
      // console.log(state.user);
      if (state?.user?.classes) {
        setCustomCSS();
      }
    } catch (error: any | AxiosError) {
      console.log('Cannot get user', error);
      if (error.response?.status === 401) {
        console.log('access denied!');
        logoutUser();
      }
      return error;
    }
  }
};

const deleteById = async (table: string, id: string): Promise<any> => {
  if (state.token) {
    try {
      const config = { headers: { Authorization: 'Bearer ' + state.token }, params: {} };
      // if(id) { config["params"] = { id: id }; }
      // console.log("delete query", table, id);
      const response = await axios.delete('/api/' + table + '/' + id, config);
      // console.log(response.data);
      return response;
    } catch (error) {
      console.log('Cannot delete', error);
      return error;
    }
  }
  console.log('No token. Fail.');
};

const renderSite = async (id: number | string) => {
  const { data } = await post('publish', { id });
  console.log(data);
  const url = `${window.location.origin}/api/files/${id}/`;
  if (!browserTab || browserTab?.closed) {
    browserTab = window.open(url, '_blank') as Window;
    browserTab?.focus();
  } else {
    browserTab.location.reload();
  }
  browserTab?.focus();
};

const scrollTo = (id: number|string) => {
  let element = document.querySelector(`#${id}`);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
};

export default {
  state,
  getFile,
  get,
  post,
  postUnauthorized,
  getUnauthorized,
  getUser,
  deleteById,
  logoutUser,
  version: project?.version,
  git: 'https' + project?.repository?.url?.slice(3, -4),
  getExtensions,
  convertJSONtoHTML,
  setCustomCSS,
  renderSite,
  scrollTo,
};
