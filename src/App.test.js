import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("react-router-dom", () => ({
  Link: ({ children }) => <div>{children}</div>,
  Navigate: () => null,
  Route: ({ element }) => element,
  Routes: ({ children }) => <>{children}</>,
  useLocation: () => ({ pathname: "/" }),
  useNavigate: () => jest.fn(),
}), { virtual: true });

Object.defineProperty(window, "crypto", {
  value: {
    getRandomValues: (array) => array.fill(1),
    subtle: {
      digest: jest.fn(),
    },
  },
  configurable: true,
});

test("renders public attendance page", () => {
  render(<App />);
  expect(
    screen.getByRole("heading", {
      name: /open camera, capture face, and prepare the photo for aws/i,
    })
  ).toBeInTheDocument();
});
