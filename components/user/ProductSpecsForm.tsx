/**
 * 产品参数表单组件
 */
import React from 'react';

interface ProductSpecsFormProps {
  productSize: string;
  appScenario: string;
  productCaliber: string;
  onSizeChange: (value: string) => void;
  onScenarioChange: (value: string) => void;
  onCaliberChange: (value: string) => void;
}

export const ProductSpecsForm: React.FC<ProductSpecsFormProps> = ({
  productSize,
  appScenario,
  productCaliber,
  onSizeChange,
  onScenarioChange,
  onCaliberChange,
}) => {
  return (
    <div className="pt-1.5 border-gray-100">
      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">
        补充参数 (Specs)
      </label>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 w-10 flex-shrink-0">
            尺寸<span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            placeholder="例如：10cm × 10cm 或 100mm × 50mm"
            className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 ${
              !productSize.trim()
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-orange-500'
            }`}
            value={productSize}
            onChange={(e) => onSizeChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 w-10 flex-shrink-0">场景</span>
          <input
            type="text"
            placeholder="桌面/户外"
            className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            value={appScenario}
            onChange={(e) => onScenarioChange(e.target.value)}
          />
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[10px] text-gray-500 w-10 flex-shrink-0 pt-1">规格</span>
          <textarea
            placeholder="例如：50mm口径、不锈钢材质、防水等级IP68..."
            className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none min-h-[70px]"
            value={productCaliber}
            onChange={(e) => onCaliberChange(e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};
