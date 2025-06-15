import React, { ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

const PageContent: React.FC<PageContentProps> = ({ children, className }) => {
  return (
    <KeyboardAvoidingView behavior="padding">
      <ScrollView keyboardShouldPersistTaps="handled">
        <View>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PageContent;
