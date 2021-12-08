export const getBasename = () => {
  return `/${process.env.PUBLIC_URL?.split('/').pop()}`;
};

export const isNavActive = (to : string, exact: boolean, path: string) => {
  return exact ? path === to : path.startsWith(to)
}

export const isValidMail = (mail: string) => {
  var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(mail?.toLowerCase());
}

/**
 * Check whether the password is between 8 and 64 characters long
 */
export const isValidPassword = (password: string) => {
  return password.length >=  8 && password.length <= 64
}