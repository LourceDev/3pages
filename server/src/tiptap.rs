use std::collections::HashMap;

use crate::utils;
use serde::{Deserialize, Serialize};
use serde_json::Value;

/*
export type JSONContent = {
  type?: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: {
    type: string;
    attrs?: Record<string, any>;
    [key: string]: any;
  }[];
  text?: string;
  [key: string]: any;
};

ref: https://github.com/ueberdosis/tiptap/blob/71db1f26e8a998c1675f183d99eee4291f45e50f/packages/core/src/types.ts#L425
*/

#[derive(Debug, Deserialize, Serialize)]
pub struct TiptapMark {
    #[serde(rename = "type")]
    pub type_: String,
    pub attrs: Option<HashMap<String, Value>>,
    #[serde(flatten)]
    pub extra: HashMap<String, Value>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct TiptapJsonContent {
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub attrs: Option<HashMap<String, Value>>,
    pub content: Option<Vec<TiptapJsonContent>>,
    pub marks: Option<Vec<TiptapMark>>,
    pub text: Option<String>,
    #[serde(flatten)]
    pub extra: HashMap<String, Value>,
}

impl TiptapJsonContent {
    pub fn count_words(&self) -> i64 {
        let mut ans = 0;
        // list of items to be processed
        let mut queue = vec![self];

        while let Some(jc) = queue.pop() {
            if let Some(text) = &jc.text {
                ans += utils::count_words(text);
            }

            // put up nested content for processing
            if let Some(content) = &jc.content {
                queue.extend(content);
            }
        }

        ans
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn word_count() {
        let json = r#"{"type":"doc","content":[{"type":"heading","attrs":{"level":3},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"GNU AFFERO GENERAL PUBLIC LICENSE"}]},{"type":"paragraph","content":[{"type":"text","text":"Version 3, 19 November 2007"}]},{"type":"paragraph","content":[{"type":"text","text":"Copyright © 2007 Free Software Foundation, Inc. <"},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://fsf.org/","target":"_blank","rel":"noopener noreferrer nofollow","class":null}}],"text":"https://fsf.org/"},{"type":"text","text":">"},{"type":"hardBreak"},{"type":"text","text":"Everyone is permitted to copy and distribute verbatim copies of this license document, but changing it is not allowed."}]},{"type":"heading","attrs":{"level":4},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Preamble"}]},{"type":"paragraph","content":[{"type":"text","text":"The GNU Affero General Public License is a free, copyleft license for software and other kinds of works, specifically designed to ensure cooperation with the community in the case of network server software."}]},{"type":"paragraph","content":[{"type":"text","text":"The licenses for most software and other practical works are designed to take away your freedom to share and change the works. By contrast, our General Public Licenses are intended to guarantee your freedom to share and change all versions of a program--to make sure it remains free software for all its users."}]},{"type":"paragraph","content":[{"type":"text","text":"When we speak of free software, we are referring to freedom, not price. Our General Public Licenses are designed to make sure that you have the freedom to distribute copies of free software (and charge for them if you wish), that you receive source code or can get it if you want it, that you can change the software or use pieces of it in new free programs, and that you know you can do these things."}]},{"type":"paragraph","content":[{"type":"text","text":"Developers that use our General Public Licenses protect your rights with two steps: (1) assert copyright on the software, and (2) offer you this License which gives you legal permission to copy, distribute and/or modify the software."}]},{"type":"paragraph","content":[{"type":"text","text":"A secondary benefit of defending all users' freedom is that improvements made in alternate versions of the program, if they receive widespread use, become available for other developers to incorporate. Many developers of free software are heartened and encouraged by the resulting cooperation. However, in the case of software used on network servers, this result may fail to come about. The GNU General Public License permits making a modified version and letting the public access it on a server without ever releasing its source code to the public."}]},{"type":"paragraph","content":[{"type":"text","text":"The GNU Affero General Public License is designed specifically to ensure that, in such cases, the modified source code becomes available to the community. It requires the operator of a network server to provide the source code of the modified version running there to the users of that server. Therefore, public use of a modified version, on a publicly accessible server, gives the public access to the source code of the modified version."}]},{"type":"paragraph","content":[{"type":"text","text":"An older license, called the Affero General Public License and published by Affero, was designed to accomplish similar goals. This is a different license, not a version of the Affero GPL, but Affero has released a new version of the Affero GPL which permits relicensing under this license."}]},{"type":"paragraph","content":[{"type":"text","text":"The precise terms and conditions for copying, distribution and modification follow."}]}]}"#;
        let parsed = serde_json::from_str::<TiptapJsonContent>(json).unwrap();
        assert_eq!(parsed.count_words(), 460);
    }
}
