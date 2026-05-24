import { ConfigProvider } from "antd";
import faIR from "antd/locale/fa_IR";

import { antdTheme } from "../styles/antd-theme";

interface Props {
  children: React.ReactNode;
}

export const AntdProvider = ({ children }: Props) => {
  return (
    <ConfigProvider locale={faIR} theme={antdTheme} direction="rtl">
      {children}
    </ConfigProvider>
  );
};
