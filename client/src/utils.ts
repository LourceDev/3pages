import { Slide, toast, ToastOptions, TypeOptions } from "react-toastify";

function createNotifyFunction(type: TypeOptions) {
  return (message: string, options?: ToastOptions) => {
    toast(message, {
      type,
      autoClose: 1500,
      transition: Slide,
      ...options,
    });
  };
}

const success = createNotifyFunction("success");
const error = createNotifyFunction("error");

export function notifySuccess(message: string, options?: ToastOptions) {
  return success(message, options);
}

export function notifyFailure(message: string, options?: ToastOptions) {
  return error(message, options);
}

export function getRandomIntInclusive(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}
