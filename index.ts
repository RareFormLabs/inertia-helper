import { useForm } from "@inertiajs/vue3";

interface FormProps {
  action?: string;
  [key: string]: any;
}

const getCsrfMetaEl = () => {
  return document.head.querySelector("meta[csrf]") as HTMLMetaElement | null;
};

const getCsrfToken = (csrfMeta?: HTMLMetaElement) => {
  const meta = csrfMeta ?? getCsrfMetaEl();
  const tokenName = meta?.getAttribute("name");
  const tokenValue = meta?.getAttribute("content");
  if (!tokenName || !tokenValue) {
    return null;
  }
  return { [tokenName as string]: tokenValue };
};

const fetchNewCsrfToken = async () => {
  const getSessionInfo = function () {
    return fetch("/actions/users/session-info", {
      headers: {
        Accept: "application/json",
      },
    }).then((response) => response.json());
  };
  const sessionInfo = await getSessionInfo();
  return {
    csrfTokenName: sessionInfo.csrfTokenName,
    csrfTokenValue: sessionInfo.csrfTokenValue,
  };
};

const cUseForm = (props: FormProps) => {
  let formObject = {
    action: "",
    ...props,
  };
  const csrfMeta: HTMLMetaElement | null = getCsrfMetaEl();
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

    if (form.action.includes("login")) {
      // Store user's onSuccess handler if it exists
      const userOnSuccess = options.onSuccess;

      options.onSuccess = (page) => {
        if (userOnSuccess) {
          // Call user's handler first
          userOnSuccess(page);
        }
        const metaEl = getCsrfMetaEl();
        fetchNewCsrfToken().then((newToken) => {
          if (metaEl) {
            metaEl.setAttribute("name", newToken.csrfTokenName);
            metaEl.setAttribute("content", newToken.csrfTokenValue);
          }
        });
      };
    }

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
