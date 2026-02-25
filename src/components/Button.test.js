import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Button from "./Button";

describe("Button Component", () => {
    it("renders correctly with title", () => {
        const { getByText } = render(<Button title="Click Me" />);
        expect(getByText("Click Me")).toBeTruthy();
    });

    it("calls onPress when tapped", () => {
        const mockOnPress = jest.fn();
        const { getByText } = render(
            <Button title="Submit" onPress={mockOnPress} />
        );

        fireEvent.press(getByText("Submit"));
        expect(mockOnPress).toHaveBeenCalled();
    });

    it("does not call onPress when disabled", () => {
        const mockOnPress = jest.fn();
        const { getByText } = render(
            <Button title="Disabled" onPress={mockOnPress} disabled={true} />
        );

        fireEvent.press(getByText("Disabled"));
        expect(mockOnPress).not.toHaveBeenCalled();
    });

    it("shows no text when loading is true", () => {
        const { queryByText } = render(<Button title="Loading" loading={true} />);
        expect(queryByText("Loading")).toBeNull();
    });
});
