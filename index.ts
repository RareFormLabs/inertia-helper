import { useForm } from "@inertiajs/vue3";

interface FormProps {
  action?: string;
  [key: string]: any;
}

interface SessionResponse {
  csrfTokenName: string;
  csrfTokenValue: string;
}

interface CsrfToken {
  [key: string]: string;
}

const CSRF_ENDPOINT = "/actions/users/session-info";

/**
 * Gets CSRF meta element from document head
 */
const getCsrfMetaEl = () =>
  document.head.querySelector<HTMLMetaElement>("meta[csrf]");

/**
 * Extracts CSRF token from meta element
 */
const getCsrfToken = (csrfMeta?: HTMLMetaElement | null): CsrfToken | null => {
  const meta = csrfMeta ?? getCsrfMetaEl();
  const tokenName = meta?.getAttribute("name");
  const tokenValue = meta?.getAttribute("content");

  return tokenName && tokenValue ? { [tokenName]: tokenValue } : null;
};

/**
 * Fetches new CSRF token from server
 * @throws Error if fetch fails or response is invalid
 */
const fetchNewCsrfToken = async (): Promise<SessionResponse> => {
  try {
    const response = await fetch(CSRF_ENDPOINT, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `Failed to fetch CSRF token: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
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
