import { useForm } from "@inertiajs/vue3";

interface FormProps {
  action?: string;
  [key: string]: any;
}

const getCsrfToken = (csrfMeta: HTMLMetaElement) => {
  const meta = csrfMeta ?? document.head.querySelector("meta[csrf]");
  const tokenName = meta.getAttribute("name");
  const tokenValue = meta.getAttribute("content");
  return { [tokenName as string]: tokenValue };
};

const cUseForm = (props: FormProps) => {
  let formObject = {
    action: "",
    ...props,
  };
  const csrfMeta: HTMLMetaElement | null =
    document.head.querySelector("meta[csrf]");
  if (csrfMeta !== null) {
    formObject = {
      ...formObject,
      ...getCsrfToken(csrfMeta),
    };
  }

  // Initialize form with action property
  const form = useForm(formObject);
  const originalPost = form.post.bind(form);

  form.post = (url, options = {}) => {
    // Set action to the URL (entries/save-entry)
    form.action = url;

    const mergedOptions = {
      forceFormData: true,
      ...options,
    };

    // Call original post with empty URL
    return originalPost("", mergedOptions);
  };

  return form;
};

export default cUseForm;
